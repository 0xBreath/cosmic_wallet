import {Idl, Program as AnchorProgram, Provider} from "@project-serum/anchor";
import {Connection, PublicKey, TransactionConfirmationStatus,} from "@solana/web3.js";
import {
  Account,
  AccountClosedUpdate,
  AccountStatic,
  AccountUpdate,
  AccountUpdateHandler,
  buildRPCDataSource,
  DataSource,
  InsertProgramReturn,
  ListenProgram,
  ProgramMethods,
  remapObject,
} from "@staratlas/data-source";
import {nanoid} from "nanoid";
import {setIntervalAsync, SetIntervalAsyncTimer,} from "set-interval-async/dynamic";
import {getNow} from "../../shared";

export type ServiceHandler<Accounts, AccountId extends keyof Accounts> = Record<
  AccountId,
  Map<string, AccountUpdateHandler<Accounts[keyof Accounts]>>
>;

export type BasicServiceConfig = {
  /** Duration in seconds to wait for an account update before a full refresh of the data is performed */
  accountUpdateTimeoutSeconds?: number;
};

export type BasicServiceStartConfig =
  | { rpcUrl: string; rpcUrlWs?: string }
  | { dataSource: DataSource };

export abstract class BasicService<
  IDL extends Idl,
  Accounts extends Record<keyof Accounts & string, Account>,
  Program extends ListenProgram<Accounts, IDL>,
> {
  private static HEALTH_CHECK_EXECUTION_INTERVAL = 15000;

  private _dataSource: DataSource | undefined;

  private _confirmationStatus: TransactionConfirmationStatus | "recent" =
    "confirmed";
  private _insertProgramReturn: InsertProgramReturn | undefined;
  private _program: Program;
  private _accountClosedHandler:
    | ((update: AccountClosedUpdate) => void)
    | null = null;
  private _accountUpdateTimeoutSeconds: number;
  private _lastAccountUpdate = getNow();
  private _socketHealthCheckInterval: SetIntervalAsyncTimer | null = null;
  private _startConfig: BasicServiceStartConfig | null = null;

  public anchorProgram: ProgramMethods<IDL>;

  protected _handlers: {
    [K in keyof Accounts]: Map<string, AccountUpdateHandler<Accounts[K]>>;
  };

  protected get initialized(): boolean {
    return !!this._dataSource;
  }

  constructor(
    programId: PublicKey,
    private idl: IDL,
    private Program: {
      new (p: ProgramMethods<IDL>): Program;
    },
    private accounts: {
      [K in keyof Accounts]: AccountStatic<Accounts[K], IDL>;
    },
    config?: BasicServiceConfig,
  ) {
    const { anchorProgram, program, handlers } = this.configure(programId);

    this.anchorProgram = anchorProgram;
    this._program = program;
    this._handlers = handlers;
    this._accountUpdateTimeoutSeconds =
      config?.accountUpdateTimeoutSeconds ?? 60;

    this.checkHealth = this.checkHealth.bind(this);
  }

  private async checkHealth(): Promise<void> {
    if (!this._dataSource || !this._startConfig) return;

    if (
      getNow() - this._lastAccountUpdate >= this._accountUpdateTimeoutSeconds &&
      this._insertProgramReturn
    ) {
      console.warn(
        `No account updates received in the ${this.Program.name} service in ${this._accountUpdateTimeoutSeconds} seconds. Refreshing all accounts.`,
      );

      // If using the kafka data source only refresh all since close / reopen is unsupported
      if ("dataSource" in this._startConfig) {
        this._insertProgramReturn.refresh();
      } else {
        // Otherwise, restart the data source
        await this.start(this._startConfig);
      }
    }
  }

  public configure(programId: PublicKey): {
    anchorProgram: ProgramMethods<IDL>;
    program: Program;
    handlers: {
      [K in keyof Accounts]: Map<string, AccountUpdateHandler<Accounts[K]>>;
    };
  } {
    console.log(
      `Constructing BasicService for program: ${
        this.idl.name
      } with public key: ${programId.toBase58()}`,
    );
    const anchorProgram = new AnchorProgram(
      this.idl,
      programId,
      {} as Provider,
    );

    const out: {
      anchorProgram: ProgramMethods<IDL>;
      program: Program;
      handlers: {
        [K in keyof Accounts]: Map<string, AccountUpdateHandler<Accounts[K]>>;
      };
    } = {
      anchorProgram,
      program: new this.Program(anchorProgram),
      handlers: remapObject(this.accounts, () => {
        return new Map();
      }),
    };

    this.anchorProgram = out.anchorProgram;
    this._program = out.program;
    this._handlers = out.handlers;

    return out;
  }

  get programId(): PublicKey {
    return this.anchorProgram.programId;
  }

  public async start(config: BasicServiceStartConfig): Promise<void> {
    console.log("Starting BasicService for program:", this.idl.name);

    /** Save start config so it can be referenced later */
    this._startConfig = config;

    if (this._insertProgramReturn) await this._insertProgramReturn.close();

    /** If constructing an RPC data source, create our own connection and datasource that lives inside this class */
    if (!("dataSource" in this._startConfig)) {
      if (this._dataSource) await this._dataSource.closeDataSource();

      const connection = new Connection(this._startConfig.rpcUrl, {
        commitment: "confirmed",
        wsEndpoint: this._startConfig.rpcUrlWs,
      });
      this._dataSource = buildRPCDataSource(connection);
    } else {
      this._dataSource = this._startConfig.dataSource;
    }

    /** The datasource should exist by this point */
    if (!this._dataSource) {
      throw new Error("Failed to initialize data source in BasicService");
    }

    this.createListeners();

    this._insertProgramReturn = await this._dataSource.insertProgram(
      this._program,
      this._confirmationStatus,
    );

    if (!this._socketHealthCheckInterval) {
      this._socketHealthCheckInterval = setIntervalAsync(
        this.checkHealth,
        BasicService.HEALTH_CHECK_EXECUTION_INTERVAL,
      );
    }

    this._lastAccountUpdate = getNow();
  }

  private createListeners(): void {
    this._program.setAccountClosedListener(this.handleAccountClose.bind(this));

    for (const key of Object.keys(this.accounts)) {
      const k = key as keyof Accounts;
      const account = this.accounts[k];

      this._program.setAccountListener(
        k,
        account,
        (update: AccountUpdate<Accounts[keyof Accounts]>) =>
          this.handleAccountUpdate(update, k),
      );
    }
  }

  private shouldEmitEventForConfirmation(
    status: TransactionConfirmationStatus | "recent",
  ): boolean {
    return status === this._confirmationStatus;
  }

  private handleAccountUpdate<K extends keyof Accounts>(
    update: AccountUpdate<Accounts[K]>,
    accountKey: K,
  ): void {
    const handlers = [...this._handlers[accountKey].values()];

    if (!handlers.length)
      console.warn(
        `No handlers specified for ${String(accountKey)} account changes`,
      );

    if (this.shouldEmitEventForConfirmation(update.confirmationStatus)) {
      for (const handler of handlers) handler(update);
    }

    this._lastAccountUpdate = getNow();
  }

  public addAccountUpdateHandler<K extends keyof Accounts>(
    handler: (update: AccountUpdate<Accounts[K]>) => void,
    accountKey: K,
  ): string {
    const handlerId = nanoid();

    this._handlers[accountKey].set(handlerId, handler);

    return handlerId;
  }

  private handleAccountClose(update: AccountClosedUpdate): void {
    if (this._accountClosedHandler) {
      this._accountClosedHandler(update);
    } else {
      console.warn(
        "No handler specified for account close events for program:",
        this.idl.name,
      );
    }

    this._lastAccountUpdate = getNow();
  }

  public setOnAccountCloseHandler(
    handler: (update: AccountClosedUpdate) => void,
  ): void {
    this._accountClosedHandler = handler;
  }

  public removeAccountUpdateHandler(
    accountId: keyof Accounts,
    handlerId: string,
  ): boolean {
    return this._handlers[accountId].delete(handlerId);
  }
}
