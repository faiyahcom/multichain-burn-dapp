export const tokenStatus = ["all", "enabled", "disabled"] as const;
export type TokenStatus = (typeof tokenStatus)[number];
export const tokenStatusLabels: Record<TokenStatus, string> = {
  all: "All",
  enabled: "Active",
  disabled: "Disabled",
};
export const tokenStatusLetters: Record<TokenStatus, string> = {
  all: "",
  enabled: "A",
  disabled: "D",
};
export const tokenStatusColors: Record<TokenStatus, string> = {
  all: "",
  enabled: "#7af4cb",
  disabled: "#ff8e97",
};
