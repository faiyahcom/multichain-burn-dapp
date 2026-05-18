import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { AnchorProvider, type Idl, Program } from "@coral-xyz/anchor";
import idl from "@/web3/contracts/launchpad.json";
import { LAUNCHPAD_PROGRAM_SOLANA_ADDRESS } from "@/web3";

export const LAUNCHPAD_PROGRAM_ID = new PublicKey(
    LAUNCHPAD_PROGRAM_SOLANA_ADDRESS,
);

type LaunchpadProgramIdl = typeof idl & Idl;

export type BrowserWallet = {
    publicKey: PublicKey;
    signTransaction: (tx: Transaction) => Promise<Transaction>;
    signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>;
};

export function getLaunchpadProgram(
    connection: Connection,
    wallet: BrowserWallet,
): Program<LaunchpadProgramIdl> {
    const provider = new AnchorProvider(
        connection,
        wallet as AnchorProvider["wallet"],
        { preflightCommitment: "processed" },
    );

    const idlWithAddress = {
        ...idl,
        address: LAUNCHPAD_PROGRAM_SOLANA_ADDRESS,
    } as LaunchpadProgramIdl;
    return new Program(idlWithAddress, provider);
}
