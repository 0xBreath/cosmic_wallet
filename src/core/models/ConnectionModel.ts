import { Commitment, Connection, Transaction } from "@solana/web3.js";
import { action, computed, makeAutoObservable, makeObservable } from "mobx";
import { formatExplorerLink } from "@staratlas/data-source/src/transactions/transactionHandling";
import bs58 from "bs58";

export const DEFAULT_CLUSTER = "localnet";
export const DEFAULT_COMMITMENT = "confirmed";

export type ClusterConfig = {
  httpEndPoint: string;
  wsEndPoint?: string;
  slug: ClusterSlug;
  label: string;
};

export type ClusterSlug = "mainnet-beta" | "localnet" | "custom";

type ConnectionModelData = {
  connection: Connection;
  cluster: ClusterConfig;
};

export class ConnectionModel {
  constructor() {
    makeAutoObservable(this);

    this.selectCluster = this.selectCluster.bind(this);
    this.setCustomCluster = this.setCustomCluster.bind(this);
    this.getConnection = this.getConnection.bind(this);
    this.formatTransactionLink = this.formatTransactionLink.bind(this);
    this.formatAccountLink = this.formatAccountLink.bind(this);
    this.formatMessageLink = this.formatMessageLink.bind(this);
    this.logTransactionResult = this.logTransactionResult.bind(this);

    const defaultCluster = (
      !!process.env.SOLANA_CLUSTER &&
      Object.keys(this._clusters).includes(process.env.SOLANA_CLUSTER)
        ? process.env.SOLANA_CLUSTER
        : DEFAULT_CLUSTER
    ) as ClusterSlug;

    this.data = makeAutoObservable(this.getConnection(defaultCluster));
  }

  protected data: ConnectionModelData;
  /** This is only set to keep track of it in tests, the connection object doesn't give it to us lmao */
  protected wsEndpoint: string | undefined = undefined;
  private static _instance: ConnectionModel;
  static get instance(): ConnectionModel {
    if (!this._instance) {
      this._instance = new ConnectionModel();
    }
    return this._instance;
  }

  private _clusters: {
    [key in ClusterSlug]: ClusterConfig | null;
  } = {
    "mainnet-beta": {
      httpEndPoint:
        "https://rpc.hellomoon.io/57dbc69d-7e66-4454-b33e-fa6a4b46170f",
      wsEndPoint: "wss://rpc.hellomoon.io/57dbc69d-7e66-4454-b33e-fa6a4b46170f",
      slug: "mainnet-beta",
      label: "Mainnet",
    },
    localnet: {
      httpEndPoint: "http://localhost:8899",
      wsEndPoint: undefined,
      slug: "localnet",
      label: "Localnet",
    },
    custom: null,
  };

  get clusters(): ClusterConfig[] {
    return Object.values(this._clusters).filter((c) => c !== null);
  }

  protected _commitment: Commitment = "confirmed";

  get commitment(): Commitment {
    return this._commitment;
  }

  get connection(): Connection {
    return this.data.connection;
  }

  get cluster(): ClusterConfig {
    return this.data.cluster;
  }

  get mainnetUrl(): string {
    return this._clusters["mainnet-beta"].httpEndPoint;
  }

  get availableClusters(): ClusterConfig[] {
    return Object.values(this.clusters);
  }

  get customClusterExists(): boolean {
    return !!this._clusters["custom"];
  }

  /** Select a different cluster, e.g. `{ known: 'atlasnet' }` */
  selectCluster(cluster: ClusterSlug): void {
    const result = this.getConnection(cluster);

    this.data.connection = result.connection;
    this.data.cluster = result.cluster;
  }

  setCustomCluster(
    httpEndPoint: string,
    label?: string,
    wsEndPoint?: string,
  ): void {
    const customClusterConfig: ClusterConfig = {
      httpEndPoint,
      wsEndPoint,
      slug: "custom",
      label: label || "Custom",
    };
    this._clusters[customClusterConfig.slug] = customClusterConfig;
  }

  protected getConnection(slug: ClusterSlug): ConnectionModelData {
    const cluster: ClusterConfig = this._clusters[slug];
    const connection = new Connection(cluster.httpEndPoint, {
      wsEndpoint: cluster.wsEndPoint,
      commitment: DEFAULT_COMMITMENT,
    });

    this.wsEndpoint = cluster.wsEndPoint;

    return {
      connection,
      cluster,
    };
  }

  formatTransactionLink(txSig: string): string {
    switch (this.cluster.slug) {
      case "mainnet-beta":
        return `https://explorer.solana.com/tx/${txSig}`;
      case "localnet":
      case "custom":
        const clusterUrl = encodeURIComponent(this.connection.rpcEndpoint);
        return `https://explorer.solana.com/tx/${txSig}?cluster=custom&customUrl=${clusterUrl}`;
      default:
        throw new Error("Invalid cluster slug for formatExplorerAccountLink");
    }
  }

  formatAccountLink(key: string): string {
    switch (this.cluster.slug) {
      case "mainnet-beta":
        return `https://explorer.solana.com/address/${key}`;
      case "localnet":
      case "custom":
        const clusterUrl = encodeURIComponent(this.connection.rpcEndpoint);
        return `https://explorer.solana.com/address/${key}?cluster=custom&customUrl=${clusterUrl}`;
      default:
        throw new Error("Invalid cluster slug for formatExplorerAccountLink");
    }
  }

  formatMessageLink(transaction: Transaction): string {
    const serializedTransaction = transaction.serializeMessage();
    const message = encodeURIComponent(
      serializedTransaction.toString("base64"),
    );

    switch (this.cluster.slug) {
      case "mainnet-beta":
        return `https://explorer.solana.com/tx/inspector?message=${message}`;
      case "localnet":
      case "custom":
        const clusterUrl = encodeURIComponent(this.connection.rpcEndpoint);
        return `https://explorer.solana.com/tx/inspector?message=${message}&cluster=custom&customUrl=${clusterUrl}`;
      default:
        throw new Error("Invalid cluster slug for formatExplorerAccountLink");
    }
  }

  logTransactionResult(transaction: Transaction): void {
    if (!transaction.signature) {
      console.debug("Transaction has no signature");
      return;
    }

    console.debug("Message link: ", this.formatMessageLink(transaction));

    console.debug(
      `Transaction link: ${this.formatTransactionLink(
        bs58.encode(transaction.signature),
      )}`,
    );
  }
}
