import type { PoolKind } from "./pool";

export interface NotiItem {
  id: string;
  timestamp: string;
  userAddress: string;
  title: string | null;
  content: string | null;
  is_read: boolean;
  meta: NotiMeta | null;
}

export interface NotiMeta {
  poolName?: string;
  poolAddress?: string;
  user?: string;
  txHash?: string;
  poolKind?: 0 | 1;
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
