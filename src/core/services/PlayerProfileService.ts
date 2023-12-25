import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { AsyncSigner } from "@staratlas/data-source";
import {
  PermissionType,
  PLAYER_PROFILE_IDL,
  PlayerName,
  PlayerProfile,
  PlayerProfileAccounts,
  PlayerProfileIDL,
  PlayerProfileProgram,
  ProfileRoleMembership,
  RoleAccount,
} from "@staratlas/player-profile";

import { BasicService } from ".";

export type KeyEntry<T> = {
  key: PublicKey | AsyncSigner;
  expireTime: BN | null;
  permissions: PermissionType<T>;
  scope: PublicKey;
};

export class PlayerProfileService extends BasicService<
  PlayerProfileIDL,
  PlayerProfileAccounts,
  PlayerProfileProgram
> {
  static get instance(): PlayerProfileService {
    if (!this._instance) {
      this._instance = new PlayerProfileService();
    }
    return this._instance;
  }
  private static _instance: PlayerProfileService;

  constructor() {
    super(
      new PublicKey(
        process.env.PLAYER_PROFILE_PROGRAM_ID ?? PublicKey.default.toString(),
      ),
      PLAYER_PROFILE_IDL,
      PlayerProfileProgram,
      {
        playerName: PlayerName,
        profile: PlayerProfile,
        role: RoleAccount,
        roleMembership: ProfileRoleMembership,
      },
    );
  }
}
