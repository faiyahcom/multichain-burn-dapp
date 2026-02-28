import { Link, useLocation } from "@tanstack/react-router";
import { ModeToggle } from "../../shared/theme/mode-toggle";
import { navItems, navSection, NavSectionLabel } from "./const";

export function Sidebar() {
  const pathname = useLocation({
    select: (location) => location.pathname,
  });
  return (
    <nav
      className="flex h-full max-h-full w-60 flex-col justify-between gap-6 overflow-y-auto pt-8.25 pr-2 pb-9.75 pl-4.75"
      style={{
        scrollbarWidth: "thin",
      }}
    >
      {Object.values(navSection).map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-4.25">
          <p className="text-xs font-medium tracking-2-percent text-sub-text uppercase">
            {NavSectionLabel[section]}
          </p>
          <ul className="space-y-4.5">
            {navItems
              .filter((item) => item.section === section)
              .map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <li
                    key={itemIndex}
                    className="group flex items-center gap-4.25"
                    data-active={pathname === item.to}
                  >
                    <div className="w-1.75 self-stretch rounded-full bg-transparent transition-colors group-data-[active='true']:bg-active" />
                    <div className="flex items-center gap-2.75 pt-1.25 pb-2.5">
                      {Icon && (
                        <Icon
                          className={`size-3.75 shrink-0 transition-colors group-data-[active='true']:text-active`}
                        />
                      )}
                      <span className="text-sm font-normal tracking-2-percent transition-colors group-data-[active='true']:font-bold group-data-[active='true']:text-active">
                        {item.to ? (
                          <Link to={item.to}>
                            <span>{item.label}</span>
                          </Link>
                        ) : (
                          <div>
                            <span>{item.label}</span>
                          </div>
                        )}
                      </span>
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
      <ModeToggle />
    </nav>
  );
}
