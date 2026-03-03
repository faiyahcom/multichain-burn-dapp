import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { AnchorProvider, type Idl, Program } from "@coral-xyz/anchor";
import idl from "@/web3/contracts/multichain_burn_sc_sol.json";
import { MULTICHAIN_BURN_PROGRAM_SOLANA_ADDRESS } from "@/web3";

export const MULTICHAIN_BURN_PROGRAM_ID = new PublicKey(
  MULTICHAIN_BURN_PROGRAM_SOLANA_ADDRESS,
);

export type BrowserWallet = {
  publicKey: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>;
};

export function getMultichainBurnProgram(
  connection: Connection,
  wallet: BrowserWallet,
) {
  const provider = new AnchorProvider(
    connection,
    wallet as AnchorProvider["wallet"],
    { preflightCommitment: "processed" },
  );

  // In current Anchor versions the Program constructor signature is (idl, provider?)
  // and programId is read from idl.metadata.address.
  return new Program(idl as Idl, provider);
}
