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
export type PoolKind =
  | "burn_pool"
  | "swap_pool"
  | "staking_pool"
  | "launchpad_pool";
export const POOL_KIND: Record<number, PoolKind> = {
  0: "burn_pool",
  1: "swap_pool",
  2: "staking_pool",
  3: "launchpad_pool",
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
  price: string | null;
  kind: number;
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
    kind: number;
    chainId: string;
    timestamp: string;
    status:
    | SwapPoolStatus
    | BurnPoolStatus
    | StakePoolStatus
    | LaunchpadPoolStatus;
    currentRewardAmount: string;
    merkleRootStatus: string;
    merkleRoot: string | null;
    adminCloseReason: string | null;
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
    claimPolicy?: string;
    distributionMode?: string;
    rewardVisibility?: boolean;
    isPartner?: boolean;
    settlementRetryCount?: number;
    distributeStatus?: string | null;
    distributeRetryCount?: number;
    distributeFailedAccounts?: string[];
    lowRewardNotiEnabled?: boolean;
    lowRewardNotiLastSentAt?: string | null;
    creationFeeTotal?: string;
    // Staking pool fields
    apr?: string;
    lockUpDuration?: string;
    interestStrartDelay?: string; // API typo (double 'r')
    interestStartDelay?: string; // correct spelling
    interestAccrualDuration?: string;
    claimStartDelay?: string;
    minStakingAmount?: string | null;
    maxStakingAmount?: string | null;
    stakingLimit?: string | null;
    settlementFeeTotal?: string;
    interestStopDate?: string;
  };
  // Staking pool aggregate data
  staking?: {
    totalStaked: string;
    totalRewardAccrued?: string;
    totalUnstaked?: string;
    user?: {
      address?: string;
      totalStaked: string;
      availableUnstake: string;
      totalUnstaked: string;
      rewardAccrued: string;
      availableClaim: string;
      totalClaimed: string;
      totalSettlementFee: string;
    };
  };
  returningAmountOnCanceling?: {
    amount: string;
    to: string;
  };
  launchpad?: {
    totalReward: string;
    totalRaised: string;
    claimed: string;
    distributed: string;
    user?: {
      address: string;
      depositedAmount: string;
      allocation: string;
      fee: string;
    };
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
    poolKind: number;
    recipient: string;
    executor: string;
    fee: string;
    stakeId: number | null;
    stakeDate: string | null;
    isUnstaked: boolean;
    notiFlags: number;
    executorName: string;
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
  10: "Emergency Withdraw",
  11: "Taker Deposit to Launchpad Pool",
  12: "Taker Deposit & Instant Claim Reward",
  13: "Taker Claim Reward from Launchpad Pool",
  14: "Taker Receive Reward from Launchpad Pool",
  50: "Admin Transfer Token",
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
  20: "Admin Transfer Token",
  21: "Admin Deposit Reward",

  // User actions
  30: "Deposit burn token",
  31: "Claim reward",
  32: "Swap",
  33: "Stake",
  34: "Unstake",
  35: "Claim Stake reward",
  36: "Taker Join Launchpad Pool",
  37: "Taker Claim Reward",
  38: "Taker Receive Reward",
  39: "Taker Deposit & Instantly Claim Reward",

  40: "Pool End",

  // Pool lifecycle (additional)
  70: "Create Launchpad Pool",
  71: "Launchpad Pool Submitted",
} as const;

export interface MyStakeSnapshot {
  time: number;
  stakingAmount: string;
  unlockDate: number;
  interestStartDate: number;
  durationInSecs: number;
  interestEndDate: number;
  claimableDate: number;
  rewardAmount: string;
  isUnstaked: boolean;
  tokenReward: string;
  tokenStake: string;
  stakeId: number;
  poolAdress: string;
}

export interface MyStakesResponse {
  total: number;
  page: number;
  snapshots: MyStakeSnapshot[];
}

export type StakePoolStatus =
  | "on_going"
  | "canceled"
  | "closed"
  | "draft"
  | "pending"
  | "upcoming"
  | "holding"
  | "full"
  | "ended";
export type LaunchpadPoolStatus =
  | "draft"
  | "canceled"
  | "upcoming"
  | "on_going"
  | "ended"
  | "completed"
  | "closed";

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

export const myActivityActions = pickActivityKind([1, 0, 10, 32, 30, 31, 5]);

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
