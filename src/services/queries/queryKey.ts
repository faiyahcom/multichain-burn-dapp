export const poolQueryKeys = {
    all: ["pools"] as const,
    detail: (address: string) => ["pools", "detail", address] as const,
    txns: (address: string, page?: number) => ["pools", "txns", address, page] as const,
    activities: (address: string, page?: number) => ["pools", "activities", address, page] as const,
};

export const whitelistQueryKeys = {
    listTokens: () => ["whitelist", "listTokens"] as const,
};