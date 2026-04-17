export type SwapPoolStatus =
  | "on_going"
  | "canceled"
  | "closed"
  | "draft"
  | "ended";
export type BurnPoolStatus =
  | "on_going"
  | "canceled"
  | "closed"
  | "draft"
  | "pending"
  | "upcoming"
  | "holding"
  | "ended";
export enum PoolKindCodeEnum {
  Burn = 0,
  Swap = 1,
  Stake = 2,
  Launchpad = 3,
}
export type PoolKindCode =
  | PoolKindCodeEnum.Burn
  | PoolKindCodeEnum.Swap
  | PoolKindCodeEnum.Stake
  | PoolKindCodeEnum.Launchpad;
export type PoolKind =
  | "burn_pool"
  | "swap_pool"
  | "stake_pool"
  | "launchpad_pool";
export const POOL_KIND: Record<PoolKindCode, PoolKind> = {
  [PoolKindCodeEnum.Burn]: "burn_pool",
  [PoolKindCodeEnum.Swap]: "swap_pool",
  [PoolKindCodeEnum.Stake]: "stake_pool",
  [PoolKindCodeEnum.Launchpad]: "launchpad_pool",
};
interface TokenInfo {
  address: string;
  createdAt: string;
  name: string;
  symbol: string;
  decimals: number;
  enable: boolean;
  chainId: string;
  isDropped: boolean;
  imageUri: string;
  customName: string;
  customSymbol: string;
  description: string;
  homepage: string;
  whitepaper: string;
}

export interface PoolDetailResponse {
  userAmount?: {
    address: string;
    deposited: string;
    claimed: string;
    canClaim: boolean;
  };
  depositedAmount: string;
  claimedRewardAmount: string;
  rewardAmount: string;
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  pool: {
    address: string;
    name: string;
    owner: string;
    rewardToken: string;
    tokenIn: string;
    pool_id: string;
    kind: PoolKindCode;
    chainId: string;
    timestamp: string;
    status: SwapPoolStatus | BurnPoolStatus;
    currentRewardAmount: string;
    merkleRootStatus: string;
    merkleRoot: string | null;
    adminCloseReason: string;
    rewardTokenSymbol: string;
    rewardTokenDecimals: number;
    tokenInSymbol: string;
    tokenInDecimals: number;
    burnToken?: string;
    targetVault?: string;
    timeStart: string;
    timeEnd: string;
    targetAddress: string;
    assetTypeReward: number;
    assetTypeIn: number;
    rewardNumerator: string;
    rewardDenominator: string;
    rewardAmount: string;
    settlementFee: string;
    poolCreationFee: string;
    isPartner?: boolean;
        // Staking pool fields
        apr?: string;
        lockUpDuration?: string;
        interestStrartDelay?: string; // API typo (double 'r')
        interestAccrualDuration?: string;
        claimStartDelay?: string;
    };
    // Staking pool aggregate data
    staking?: {
        totalStaked: string;
        user?: {
            totalStaked: string;
            totalUnstaked: string;
            totatClaimed: string; // API typo (missing 'l')
        };
  };
  returningAmountOnCanceling?: {
    amount: string;
    to: string;
  };
}

export interface PoolTxnsResponse {
  page: number;
  total: number;
  txns: {
    id: string;
    hash: string;
    log_ix: number;
    kind: keyof typeof txnKind;
    timestamp: string;
    tokenIn: string;
    tokenInSymbol: string;
    tokenInDecimals: number;
    amountIn: string;
    tokenOut: string;
    tokenOutSymbol: string;
    tokenOutDecimals: number;
    amountOut: string;
    chainId: string;
    poolAddress: string;
  }[];
}

export const txnKind = {
    1: "Taker Deposit",
    2: "Refund to Whitelist User",
    3: "Maker Deposit Reward",
    4: "Taker Claim Reward",
    5: "Refund to Maker",
    6: "Burn Success",
    7: "Stake",
    8: "Claim",
    9: "Unstake & Claim",
    10: "Emergency Withdraw"
} as const;

export const activityKind = {
  // Pool lifecycle
  0: "Create burn pool",
  1: "Create swap pool",
  2: "Pool Requested",
  3: "Pool Approved",
  4: "Pool Rejected",
  5: "Cancel pool",
  6: "Pool Closed",
  7: "Pool Updated",
  8: "Pool Ended",
  9: "Create stake pool",
  69: "Submit stake pool",

  // Maker action
  10: "Deposit reward token",
  11: "Maker Cancel Approve Request",
  12: "Maker Withdraw Reward",

  // Admin action
  20: "Admin Refund",
  21: "Admin Deposit Reward",

  // User actions
  30: "Deposit burn token",
  31: "Claim reward",
  32: "Swap",
  33: "Stake",
  34: "Unstake",
  35: "Claim Stake reward",

  40: "Pool End",
} as const;

export type ActivityKindKey = keyof typeof activityKind;

export const getActivityKindLabel = (kind: ActivityKindKey) => {
  return activityKind[kind];
};

type ActivityKind = typeof activityKind;

export function pickActivityKind<K extends keyof ActivityKind>(
  keys: K[],
): Pick<ActivityKind, K> {
  return Object.fromEntries(keys.map((k) => [k, activityKind[k]])) as Pick<
    ActivityKind,
    K
  >;
}

export const myActivityActions = pickActivityKind([
  1, 0, 10, 32, 30, 31, 5
]);

export interface PoolActivitiesResponse {
  page: number;
  total: number;
  activities: {
    id: string;
    hash: string;
    log_ix: number;
    timestamp: string;
    actor: string;
    kind: keyof typeof activityKind;
    poolAddress: string;
  }[];
}
