import {
  IconActivityHistory,
  IconBurnPool,
  IconFeeSettingsGear,
  IconMyCreatedPools,
  IconMyDashboard,
  IconMyParticipatedPools,
  IconPairList,
  IconPersonalInfoSettings,
  IconRevenueFeeStats,
  IconSettings,
  IconSupport,
  IconSwap,
  IconSwapHistory,
} from "@/assets/react";

export const navSection = {
  overview: "overview",
  profile_menu: "profile_menu",
  tools: "tools",
  admin: "admin",
} as const;

type NavSection = (typeof navSection)[keyof typeof navSection];

export const NavSectionLabel: Record<NavSection, string> = {
  [navSection.overview]: "Overview",
  [navSection.profile_menu]: "Profile Menu",
  [navSection.tools]: "Tools",
  [navSection.admin]: "Admin",
};

type NavChild = {
  label: string;
  tab: string;
};

type NavItem = {
  label: string;
  to?: string;
  icon?: React.ComponentType<{ className?: string }>;
  section: NavSection;
  children?: NavChild[];
};

export const navItems: NavItem[] = [
  {
    label: "Pair List",
    icon: IconPairList,
    section: navSection.overview,
    to: "/pair-list",
  },
  {
    label: "Burn Pool",
    icon: IconBurnPool,
    section: navSection.overview,
    to: "/burn",
  },
  {
    label: "Swap",
    icon: IconSwap,
    section: navSection.overview,
    to: "/swap",
  },
  // My Dashboard, Personal Info Settings, My Create Pools, My Participated Pools, Swap History, Activity History
  {
    label: "My Dashboard",
    icon: IconMyDashboard,
    section: navSection.profile_menu,
    to: "/my-dashboard",
  },
  {
    label: "Personal Info Settings",
    icon: IconPersonalInfoSettings,
    section: navSection.profile_menu,
    to: "/personal-info-settings",
  },
  {
    label: "My Create Pools",
    icon: IconMyCreatedPools,
    section: navSection.profile_menu,
    to: "/my-create-pools",
    children: [
      { label: "Burn Pool", tab: "burn-pool" },
      { label: "Swap Pool", tab: "swap-pool" },
    ],
  },

  {
    label: "My Participated Pools",
    icon: IconMyParticipatedPools,
    section: navSection.profile_menu,
    to: "/my-participated-pools",
    children: [
      { label: "Burn Pool", tab: "burn-pool" },
      { label: "Swap Pool", tab: "swap-pool" },
      { label: "Claimable", tab: "claimable" },
    ],
  },
  {
    label: "Swap History",
    icon: IconSwapHistory,
    section: navSection.profile_menu,
    to: "/swap-history",
  },
  {
    label: "Activity History",
    icon: IconActivityHistory,
    section: navSection.profile_menu,
    to: "/activity-history",
  },
  {
    label: "Support",
    icon: IconSupport,
    section: navSection.tools,
    to: "/support",
  },
  {
    label: "Settings",
    icon: IconSettings,
    section: navSection.tools,
    to: "/settings",
  },
  {
    label: "Admin Management",
    section: navSection.admin,
    to: "/admin/admin-management",
  },
  {
    label: "Whitelist Token",
    section: navSection.admin,
    to: "/admin/whitelist-token",
  },
  {
    label: "Whitelist User",
    section: navSection.admin,
    to: "/admin/whitelist-user",
  },
  {
    label: "Transfer History",
    section: navSection.admin,
    to: "/admin/transfer-history",
  },
  {
    label: "Master Pool Management",
    section: navSection.admin,
    to: "/admin/master-pool-management",
  },
  {
    label: "Revenue & Fee Stats",
    icon: IconRevenueFeeStats,
    section: navSection.admin,
    to: "/admin/revenue-fee-stats",
  },
  {
    label: "Fee Settings Management",
    icon: IconFeeSettingsGear,
    section: navSection.admin,
    to: "/admin/fee-settings-management",
  },
];
