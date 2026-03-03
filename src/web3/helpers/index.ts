import { PublicKey, Connection } from "@solana/web3.js";
import { BN } from "bn.js";
import { Buffer } from "buffer";

export const getFactoryPDA = (programId: PublicKey): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("factory")],
        programId,
    );
    return pda;
};

export const getPoolPDA = (poolId: number, programId: PublicKey): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), new BN(poolId).toArrayLike(Buffer, "le", 8)],
        programId,
    );
    return pda;
};

export const getRewardVaultPDA = (
    poolPDA: PublicKey,
    programId: PublicKey,
): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("reward-vault"), poolPDA.toBuffer()],
        programId,
    );
    return pda;
};

export const getDepositVaultPDA = (
    poolPDA: PublicKey,
    programId: PublicKey,
): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("deposit-vault"), poolPDA.toBuffer()],
        programId,
    );
    return pda;
};

export const getUserDepositPDA = (poolPDA: PublicKey, user: PublicKey, programId: PublicKey): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user-deposit"), poolPDA.toBuffer(), user.toBuffer()],
        programId
    );
    return pda;
};

import {
    NATIVE_MINT,
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

export type AssetType = 0 | 1 | 2;

export const AssetTypeEnum = {
    SPL: 0,
    SPL2022: 1,
    NATIVE: 2,
} as const;

export const detectAssetType = async (
    connection: Connection,
    mint: PublicKey,
): Promise<AssetType> => {
    // Native SOL (wrapped SOL mint address)
    if (mint.equals(NATIVE_MINT)) {
        return AssetTypeEnum.NATIVE;
    }

    const accountInfo = await connection.getAccountInfo(mint);

    if (!accountInfo) {
        throw new Error("Mint account not found");
    }

    if (accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
        return AssetTypeEnum.SPL;
    }

    if (accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
        return AssetTypeEnum.SPL2022;
    }

    throw new Error("Unknown token standard");
};
