export const tokenStatus = ["all", "enabled", "disabled"] as const;
export type TokenStatus = (typeof tokenStatus)[number];
export const tokenStatusLabels: Record<TokenStatus, string> = {
  all: "All",
  enabled: "Active",
  disabled: "Disabled",
};
