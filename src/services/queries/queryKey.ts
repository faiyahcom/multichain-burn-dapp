export const poolQueryKeys = {
    all: ["pools"] as const,
    detail: (address: string) => ["pools", "detail", address] as const,
    txns: (address: string) => ["pools", "txns", address] as const,
};