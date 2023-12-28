import "@abraham/reflection";
import { Adapter, WalletAdapterNetwork } from "@solana/wallet-adapter-base";
// import {
//   BackpackWalletAdapter,
//   SolflareWalletAdapter,
// } from "@solana/wallet-adapter-wallets";
import { CosmicWalletAdapter } from "../../wallet";

export interface IWalletAdaptorService {
  getAdaptors(network: WalletAdapterNetwork): Array<Adapter>;
}

export class WalletAdapterService implements IWalletAdaptorService {
  constructor() {}

  private static _instance: WalletAdapterService;
  static get instance(): WalletAdapterService {
    if (!this._instance) {
      this._instance = new WalletAdapterService();
    }
    return this._instance;
  }

  getAdaptors(): Array<Adapter> {
    return [
      // new LedgerWalletAdapter({
      //   derivationPath: getDerivationPath(),
      // }),
      // new SolflareWalletAdapter(),
      // new BackpackWalletAdapter(),
      // todo: CosmicWalletAdapter
      new CosmicWalletAdapter(),
    ];
  }
}
