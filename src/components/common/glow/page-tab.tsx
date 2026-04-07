import type { NavItemType } from "@/components/layout/header/glow/header-nav/const";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";

interface Props {
  navItems: NavItemType[];
}

const PageTab: React.FC<Props> = ({ navItems }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="px-6 sm:px-12">
      <div
        className="flex w-full items-center gap-4.25 overflow-x-auto sm:gap-8.5"
        style={{
          scrollbarWidth: "none",
        }}
      >
        {navItems.map((navItem) => {
          const isActive =
            navItem.activeRegexMatch &&
            currentPath.match(navItem.activeRegexMatch);

          return (
            <Link
              key={navItem.href}
              to={navItem.href}
              className={cn(
                "rounded-t-md px-2 pt-3.75 text-center sm:rounded-t-24px sm:px-3.75 sm:pt-7.75",
                "sm:min-w-68.5",
                "transition-colors duration-300",
                "bg-[#090909]",
                { "bg-[#0F0F11]": isActive },
              )}
            >
              <p
                className={cn(
                  "mx-auto w-max pb-1.25 sm:pb-2.5",
                  "text-sm font-medium sm:text-xl",
                  "transition-colors duration-300",
                  "border-b-3 border-transparent",
                  "text-mb-gray-b8",
                  {
                    "border-foreground font-bold text-foreground": isActive,
                  },
                )}
              >
                {navItem.title}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default PageTab;
