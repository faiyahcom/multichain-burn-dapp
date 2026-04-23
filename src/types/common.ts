import { LayoutGridIcon, ListIcon } from "lucide-react";
import type { FunctionComponent, SVGProps } from "react";

export const sortOrders = ["asc", "desc"] as const;
export type SortOrder = (typeof sortOrders)[number];

export const sortBys = [
  "none",
  "volume",
  "tvl",
  "timestamp",
  "joinedTime",
  "claimableReward",
  "amountBurned",
  "liquidity",
  "stakedAmount", // TODO: subject to change
  "apr", // TODO: subject to change
] as const;
export type SortBy = (typeof sortBys)[number];
export const sortBysLabels: Record<SortBy, string> = {
  none: "None",
  volume: "Volume",
  tvl: "TVL",
  timestamp: "Created At",
  joinedTime: "Newest Joined",
  claimableReward: "Claimable Reward",
  amountBurned: "Amount Burned",
  liquidity: "Liquidity",
  stakedAmount: "Staked Amount",
  apr: "APR",
};
export const sortBysShortLabels: Record<SortBy, string> = {
  none: "None",
  volume: "Volume",
  tvl: "TVL",
  timestamp: "Created At",
  joinedTime: "Newest",
  claimableReward: "Claimable",
  amountBurned: "Burned",
  liquidity: "Liquidity",
  stakedAmount: "Staked Amount",
  apr: "APR",
};

export const listLayouts = ["list", "card"] as const;
export type ListLayout = (typeof listLayouts)[number];
export const listLayoutsLabels: Record<ListLayout, string> = {
  list: "List",
  card: "Card",
};
export const listLayoutsBtnIcons: Record<
  ListLayout,
  FunctionComponent<
    SVGProps<SVGSVGElement> & {
      title?: string;
    }
  >
> = {
  list: ListIcon,
  card: LayoutGridIcon,
};

export type ErrorResponseData = {
  statusCode: number;
  error: string;
  message: string;
};

export const booleanString = [
  "true",
  "false",
  "1",
  "0",
  "enable",
  "disable",
] as const;
export type BooleanString = (typeof booleanString)[number];

export type PaginationRequest = {
  page: number;
  limit: number;
};

export type PaginationResponse = {
  page: number;
  total: number;
};
