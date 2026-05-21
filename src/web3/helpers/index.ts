import { PublicKey, Connection } from "@solana/web3.js";
import { BN } from "bn.js";
import { Buffer } from "buffer";
import {
    NATIVE_MINT,
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
    NATIVE_MINT_2022,
} from "@solana/spl-token";

// ==============================
// PDA HELPERS
// ==============================

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

export const getUserDepositPDA = (
    poolPDA: PublicKey,
    user: PublicKey,
    programId: PublicKey,
): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user-deposit"), poolPDA.toBuffer(), user.toBuffer()],
        programId,
    );
    return pda;
};

// ==============================
// LAUNCHPAD PDA HELPERS
// ==============================

export const getLaunchpadConfigPDA = (programId: PublicKey): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("launchpad-config")],
        programId,
    );
    return pda;
};

export const getLaunchpadPoolPDA = (
    poolCount: number,
    programId: PublicKey,
): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("launchpad-pool"),
            new BN(poolCount).toArrayLike(Buffer, "le", 8),
        ],
        programId,
    );
    return pda;
};

export const getLaunchpadRewardVaultPDA = (
    poolPDA: PublicKey,
    programId: PublicKey,
): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("lp-reward-vault"), poolPDA.toBuffer()],
        programId,
    );
    return pda;
};

export const getLaunchpadDepositVaultPDA = (
    poolPDA: PublicKey,
    programId: PublicKey,
): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("lp-deposit-vault"), poolPDA.toBuffer()],
        programId,
    );
    return pda;
};

// ==============================
// ASSET DETECTION
// ==============================

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

// ==============================
// TOKEN PROGRAM RESOLVER
// ==============================

export const getTokenProgramFromAssetType = (
    assetType: AssetType,
): PublicKey | null => {
    switch (assetType) {
        case AssetTypeEnum.SPL:
            return TOKEN_PROGRAM_ID;
        case AssetTypeEnum.SPL2022:
            return TOKEN_2022_PROGRAM_ID;
        case AssetTypeEnum.NATIVE:
            return TOKEN_PROGRAM_ID; // Wrapped SOL (NATIVE_MINT) is an SPL token owned by TOKEN_PROGRAM_ID
        default:
            throw new Error("Invalid asset type");
    }
};
