export const userStatus = ["all", "enabled", "disabled"] as const;
export type UserStatus = (typeof userStatus)[number];

export const userStatusLabels: Record<UserStatus, string> = {
    all: "All",
    enabled: "Enabled",
    disabled: "Disabled",
};

export const userStatusLetters: Record<UserStatus, string> = {
    all: "",
    enabled: "A",
    disabled: "D",
};

export const userStatusColors: Record<UserStatus, string> = {
    all: "",
    enabled: "#7af4cb",
    disabled: "#ff8e97",
};
