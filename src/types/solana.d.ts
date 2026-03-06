interface SolanaWallet {
  isPhantom?: boolean;
  isConnected: boolean;
  publicKey?: {
    toString(): string;
  };
  signMessage(
    message: Uint8Array,
    encoding?: string,
  ): Promise<{
    signature: Uint8Array;
  }>;
  connect(): Promise<void>;
}

interface Window {
  solana?: SolanaWallet;
}
