export interface NativePrice {
  address: string;
  chainId: string;
  symbol: string;
  decimals: number;
  price: number;
}

export interface GetNativePricesResponse {
  natives: NativePrice[];
}
