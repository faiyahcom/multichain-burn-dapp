import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { AnchorProvider, type Idl, Program } from "@coral-xyz/anchor";
import idl from "@/web3/contracts/staking.json";
import { STAKING_PROGRAM_SOLANA_ADDRESS } from "@/web3";

export const STAKING_PROGRAM_ID = new PublicKey(
  STAKING_PROGRAM_SOLANA_ADDRESS,
);

type StakingProgramIdl = typeof idl & Idl;

export type BrowserWallet = {
  publicKey: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>;
};

export function getStakingProgram(
  connection: Connection,
  wallet: BrowserWallet,
): Program<StakingProgramIdl> {
  const provider = new AnchorProvider(
    connection,
    wallet as AnchorProvider["wallet"],
    { preflightCommitment: "processed" },
  );

  const idlWithAddress = {
    ...idl,
    address: STAKING_PROGRAM_SOLANA_ADDRESS,
  } as StakingProgramIdl;
  return new Program(idlWithAddress, provider);
}
