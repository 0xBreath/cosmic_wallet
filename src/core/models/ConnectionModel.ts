import { Commitment, Connection } from "@solana/web3.js";
import { action, computed, makeAutoObservable, makeObservable } from "mobx";

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
    makeObservable(this, {
      connection: computed,
      selectCluster: action.bound,
      cluster: computed,
    });

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
      console.log("Init ConnectionModel");
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
}
