export const adminManagementRoles = ["super_admin", "admin"] as const;

export type AdminManagementRole = (typeof adminManagementRoles)[number];

export type AdminManagementStatus = "enabled" | "disabled";

export interface AdminManagementAdmin {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
  role: AdminManagementRole;
  enabled: boolean;
  createdAt: string;
}

export const adminManagementRoleLabels: Record<AdminManagementRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
};

export const adminManagementStatusLabels: Record<
  AdminManagementStatus,
  string
> = {
  enabled: "Enabled",
  disabled: "Disabled",
};

export const adminManagementStatusLetters: Record<
  AdminManagementStatus,
  string
> = {
  enabled: "A",
  disabled: "D",
};

export const adminManagementStatusColors: Record<
  AdminManagementStatus,
  string
> = {
  enabled: "#7CF0C7",
  disabled: "#FFC9C9",
};
