export const PROFILE_POOL_TYPES = ["create", "participated"] as const;

export type ProfilePoolType = (typeof PROFILE_POOL_TYPES)[number];
