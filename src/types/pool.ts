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
  price: string | null;
  kind: number;
}

export interface PoolDetailResponse {
  userAmount?: {
    address: string;
    deposited: string;
    claimed: string;
    canClaim: boolean;
    totalSettlementFee?: string;
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
    isPartner?: boolean;
    settlementRetryCount?: number;
    // Staking pool fields
    apr?: string;
    lockUpDuration?: string;
    interestStartDelay?: string; // correct spelling
    interestAccrualDuration?: string;
    claimStartDelay?: string;
    minStakingAmount?: string | null;
    maxStakingAmount?: string | null;
    stakingLimit?: string | null;
    interestStopDate?: string | null;
    // Launchpad pool fields
    claimPolicy?: string; // "instant" | "after_end"
    distributionMode?: string; // "none" | "automatic" | "claim"
    rewardVisibility?: boolean;
  };
  // Staking pool aggregate data
  staking?: {
    totalStaked: string;
    totalRewardAccrued?: string;
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
  // Launchpad pool aggregate data
  launchpad?: {
    totalReward: string;
    totalRaised: string;
    user?: {
      address: string;
      depositedAmount: string;
      allocation: string;
      fee: string;
      claimed: string;
      canClaim: boolean;
      claimableAmount: string;
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
    // Staking-specific (optional, populated only for staking txns)
    stakeId?: number;
    unlockDate?: string;
    interestStartDate?: string;
    interestEndDate?: string;
    claimableDate?: string;
    rewardAmountStr?: string;
    lockDuration?: string;
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
  11: "Launchpad Deposit",
  12: "Launchpad Claim",
  13: "Launchpad Receive Allocation",
  14: "Launchpad Refund",
  50: "Admin Transfer Token"
} as const;

export const activityKind = {
  // Pool lifecycle
  0: "Create burn pool",
  1: "Create swap pool",
  2: "Pool Requested",
  3: "Pool Approved",
  4: "Pool Rejected",
  5: "Cancel pool", // user cancel only
  6: "Pool Closed",
  7: "Pool Updated",
  8: "Pool Ended",
  9: "Create stake pool",
  69: "Submit stake pool",
  70: "Create launchpad pool",
  71: "Submit launchpad pool",

  // Maker action
  10: "Deposit reward token",
  11: "Maker Cancel Approve Request",
  12: "Maker Withdraw Reward",

  // Admin action
  20: "Admin Refund",
  21: "Admin Deposit Reward",

  // User actions
  30: "Deposit burn token",
  31: "Claim Burn reward",
  32: "Swap",
  33: "Stake",
  34: "Unstake",
  35: "Claim Stake reward",

  36: "Join Launchpad",
  37: "Claim Allocation",
  38: "Reward Received",
  39: "Deposit & Instant Claim",

  40: "Pool End",
  72: "Cancel Stake",
  73: "Cancel Launchpad",
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
  customSymbolStake: string;
  customSymbolReward: string;
  imageUriStake: string;
  imageUriReward: string;
  pool: {
    address: string;
    name: string;
    owner: string;
    rewardToken: string;
    tokenIn: string;
    pool_id: string;
    kind: PoolKindCode;
    chainId: string;
    timestamp: string; // timestamp seconds
    status: StakePoolStatus;
    currentRewardAmount: string;
    merkleRootStatus: string;
    merkleRoot: string | null;
    adminCloseReason: string | null;
    settlementRetryCount: number;
    rewardTokenSymbol: string;
    rewardTokenDecimals: number;
    tokenInSymbol: string;
    tokenInDecimals: number;
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
    apr: string; // divide by 10000 to get display percentage
    lockUpDuration: string;
    interestStartDelay: string;
    interestAccrualDuration: string;
    claimStartDelay: string;
    minStakingAmount: string | null;
    maxStakingAmount: string | null;
    stakingLimit: string | null;
    isPartner: boolean;
  };
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

type ActivityKindKeyStr = `${ActivityKindKey}`;

export type ActivityKeyList =
  | ActivityKindKeyStr
  | `${ActivityKindKeyStr},${ActivityKindKeyStr}`;

export const myActivityActions = [
  "1",
  "0",
  "10",
  "32",
  "30",
  "31,35", // both claim burn and claim stake
  "5",
  "33",
  "34",
  "36",
  "37",
  "38",
  "39",
] as const satisfies ReadonlyArray<ActivityKeyList>;
export type MyActivityAction = (typeof myActivityActions)[number];
export const myActivityActionLabels: Record<MyActivityAction, string> = {
  "1": "Create swap pool",
  "0": "Create burn pool",
  "10": "Deposit reward token",
  "32": "Swap",
  "30": "Deposit burn token",
  "31,35": "Claim reward",
  "5": "Cancel pool",
  "33": "Stake",
  "34": "Unstake",
  "36": "Join Launchpad",
  "37": "Claim Allocation",
  "38": "Reward Received",
  "39": "Deposit & Instant Claim",
};
export const getMyActivityActionLabel = (kind: MyActivityAction) => {
  return myActivityActionLabels[kind];
};
export const myActivityExcludes = (
  Object.keys(activityKind) as ActivityKindKeyStr[]
)
  .filter((k) => !myActivityActions.some((a) => a.split(",").includes(k)))
  .join(",");

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
