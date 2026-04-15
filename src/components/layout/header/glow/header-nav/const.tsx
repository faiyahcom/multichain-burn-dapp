import {
  IconMyCreatedPools,
  IconMyParticipatedPools,
  IconPersonalInfoSettings,
} from "@/assets/react";
import type { LinkProps } from "@tanstack/react-router";
import { HistoryIcon } from "lucide-react";

type AppRoutePath = LinkProps["to"];

export type NavItemType = {
  title: string;
  href: AppRoutePath;
  activeRegexMatch?: RegExp;
  icon?: React.ComponentType<{ className?: string }>;
};

export const NAV_ITEMS: NavItemType[] = [
  {
    title: "Dashboard",
    href: "/",
    // exactly the homepage
    activeRegexMatch: /^\/$/,
  },
  {
    title: "Pair",
    href: "/pair-list",
    // exactly /pair-list or start with /pair-detail
    activeRegexMatch: /^\/pair-list\/?$|^\/pair-detail\//,
  },
  {
    title: "Burn",
    href: "/burn",
    // Exactly /burn or start with /burn/
    activeRegexMatch: /^\/burn(\/|$)/,
  },
  {
    title: "Swap",
    href: "/swap",
    // Exactly /swap or start with /swap/
    activeRegexMatch: /^\/swap(\/|$)/,
  },
  {
    title: "Staking",
    href: "/staking",
    // Exactly /staking or start with /staking/
    activeRegexMatch: /^\/staking(\/|$)/,
  },
];

export const PROFILE_NAV_ITEMS: NavItemType[] = [
  {
    title: "Personal Info Settings",
    href: "/personal-info-settings",
    // Exactly /personal-info-settings
    activeRegexMatch: /^\/personal-info-settings(\/|$)/,
    icon: IconPersonalInfoSettings,
  },
  {
    title: "Created List",
    href: "/my-create-pools",
    // Exactly /my-create-pools
    activeRegexMatch: /^\/my-create-pools(\/|$)/,
    icon: IconMyCreatedPools,
  },
  {
    title: "Joined List",
    href: "/my-participated-pools",
    // Exactly /my-participated-pools
    activeRegexMatch: /^\/my-participated-pools(\/|$)/,
    icon: IconMyParticipatedPools,
  },
  {
    title: "My Activity",
    href: "/my-activity",
    // Exactly /my-activity
    activeRegexMatch: /^\/my-activity(\/|$)/,
    icon: HistoryIcon,
  },
];
