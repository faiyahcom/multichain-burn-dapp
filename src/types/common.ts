export const sortOrders = ["asc", "desc"] as const;
export type SortOrder = (typeof sortOrders)[number];

export const sortBys = ["none", "volume", "tvl", "createdAt"] as const;
export type SortBy = (typeof sortBys)[number];
export const sortBysLabels: Record<SortBy, string> = {
  none: "None",
  volume: "Volume (24h)",
  tvl: "TVL",
  createdAt: "Created At",
};
export const sortBysShortLabels: Record<SortBy, string> = {
  none: "None",
  volume: "Volume",
  tvl: "TVL",
  createdAt: "Created At",
};

export const listLayouts = ["list", "card"] as const;
export type ListLayout = (typeof listLayouts)[number];
export const listLayoutsLabels: Record<ListLayout, string> = {
  list: "List",
  card: "Card",
};
