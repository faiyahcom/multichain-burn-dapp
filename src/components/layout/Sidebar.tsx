import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ModeToggle } from "../shared/theme/mode-toggle";

type NavItem = {
  label: string;
  to?: string;
  icon?: ReactNode;
  section: "overview" | "profile_menu" | "tools";
};

const navOverviewItems: NavItem[] = [
  { label: "Pair List", to: "/", section: "overview" },
  { label: "Burn Pool", section: "overview" },
  { label: "Swap", section: "overview" },
];

const navProfileItems: NavItem[] = [
  // My Dashboard, Personal Info Settings, My Create Pools, My Participated Pools, Swap History, Activity History
  { label: "My Dashboard", to: "/", section: "profile_menu" },
  { label: "Personal Info Settings", to: "/", section: "profile_menu" },
  { label: "My Create Pools", to: "/", section: "profile_menu" },
  { label: "My Participated Pools", to: "/", section: "profile_menu" },
  { label: "Swap History", to: "/", section: "profile_menu" },
  { label: "Activity History", to: "/", section: "profile_menu" },
];

const navToolsItems: NavItem[] = [
  { label: "Support", section: "tools" },
  { label: "Settings", section: "tools" },
];

export function Sidebar() {
  return (
    <aside className="flex h-full w-64 flex-col px-6 py-6">
      <nav className="flex flex-1 flex-col gap-6 text-sm">
        {/* Overview section */}
        <div>
          <p className="mb-2 text-xs font-medium tracking-wide text-secondary-text uppercase">
            Overview
          </p>
          <ul className="space-y-1">
            {navOverviewItems.map((item) => (
              <li key={item.label}>
                {item.to ? (
                  <Link
                    to={item.to}
                    className="flex items-center gap-2 rounded-full px-3 py-2 text-sub-text transition hover:bg-inactive/60 hover:text-text &[aria-current='page']:bg-active &[aria-current='page']:text-sub-bg"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-active/70" />
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-full px-3 py-2 text-sub-text transition hover:bg-inactive/60 hover:text-text"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-inactive" />
                    <span>{item.label}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Profile menu section */}
        <div>
          <p className="mb-2 text-xs font-medium tracking-wide text-secondary-text uppercase">
            Profile Menu
          </p>
          <ul className="space-y-1">
            {navProfileItems.map((item) => (
              <li key={item.label}>
                {item.to ? (
                  <Link
                    to={item.to}
                    className="flex items-center gap-2 rounded-full px-3 py-2 text-sub-text transition hover:bg-inactive/60 hover:text-text &[aria-current='page']:bg-active &[aria-current='page']:text-sub-bg"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-inactive" />
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-full px-3 py-2 text-sub-text transition hover:bg-inactive/60 hover:text-text"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-inactive" />
                    <span>{item.label}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Tools section */}
        <div>
          <p className="mb-2 text-xs font-medium tracking-wide text-secondary-text uppercase">
            Tools
          </p>
          <ul className="space-y-1">
            {navToolsItems.map((item) => (
              <li key={item.label}>
                {item.to ? (
                  <Link
                    to={item.to}
                    className="flex items-center gap-2 rounded-full px-3 py-2 text-sub-text transition hover:bg-inactive/60 hover:text-text &[aria-current='page']:bg-active &[aria-current='page']:text-sub-bg"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-inactive" />
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-full px-3 py-2 text-sub-text transition hover:bg-inactive/60 hover:text-text"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-inactive" />
                    <span>{item.label}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <ModeToggle />
    </aside>
  );
}
