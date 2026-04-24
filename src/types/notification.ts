export interface NotiItem {
  id: string;
  timestamp: string;
  userAddress: string;
  title: string | null;
  content: string | null;
  is_read: boolean;
  meta: NotiMeta | null;
}

export const RedirectEnum = {
  PoolDetail: "pool_detail",
  FeeRevenue: "fee_revenue",
} as const;

export interface NotiMeta {
  poolName?: string;
  poolAddress?: string;
  user?: string;
  txHash?: string;
  poolKind?: 0 | 1 | 2 | 3;
  redirect?: (typeof RedirectEnum)[keyof typeof RedirectEnum];
  [key: string]: unknown;
}

export interface NotificationsListResponse {
  total: number;
  page: number;
  notis: NotiItem[];
  unread: number;
}

export interface MarkReadRequest {
  markAll?: boolean;
  updated?: number;
  ids?: string[];
}

export interface MarkReadResponse {
  updated: number;
}

export interface ToggleLowRewardNotiRequest {
  poolAddress: string;
  enabled: boolean;
}

export interface ToggleLowRewardNotiResponse {
  poolAddress: string;
  enabled: boolean;
}
