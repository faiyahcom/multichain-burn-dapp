export type NavItemType = {
  title: string;
  href: string;
  activeRegexMatch?: RegExp;
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
    // Start with /burn
    activeRegexMatch: /^\/burn/,
  },
  {
    title: "Swap",
    href: "/swap",
    // Start with /swap
    activeRegexMatch: /^\/swap/,
  },
];
