import type { AllPoolStatus, PoolType } from "@/types/admin/master-pool-management";
import type { SortBy, SortOrder } from "@/types/common";

export type ProfilePoolSearchType = {
  page: number;
  text?: string;
  status?: AllPoolStatus[];
  network?: string[];
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  poolType?: PoolType[];
};
