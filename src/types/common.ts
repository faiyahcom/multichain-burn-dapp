import { IconGrid, IconMenu } from "@/assets/react";
import type { FunctionComponent, SVGProps } from "react";

export const sortOrders = ["asc", "desc"] as const;
export type SortOrder = (typeof sortOrders)[number];

export const sortBys = ["none", "volume", "tvl", "timestamp", "ts"] as const;
export type SortBy = (typeof sortBys)[number];
export const sortBysLabels: Record<SortBy, string> = {
  none: "None",
  volume: "Volume (24h)",
  tvl: "TVL",
  timestamp: "Created At",
  ts: "New Joined",
};
export const sortBysShortLabels: Record<SortBy, string> = {
  none: "None",
  volume: "Volume",
  tvl: "TVL",
  timestamp: "Created At",
  ts: "New Joined",
};

export const listLayouts = ["card", "list"] as const;
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
  list: IconMenu,
  card: IconGrid,
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
