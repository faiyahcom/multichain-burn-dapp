import { useState, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { ModeToggle } from "../../shared/theme/mode-toggle";
import { navItems, navSection, NavSectionLabel } from "./const";

export function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const searchTab = (location.search as Record<string, string>).tab;

  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    navItems.forEach((item) => {
      if (item.subItems && item.to && pathname === item.to) {
        initial.add(item.label);
      }
    });
    return initial;
  });

  useEffect(() => {
    navItems.forEach((item) => {
      if (item.subItems && item.to && pathname === item.to) {
        setExpandedItems((prev) =>
          prev.has(item.label) ? prev : new Set([...prev, item.label]),
        );
      }
    });
  }, [pathname]);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  return (
    <div
      className="flex h-full max-h-full w-62 flex-col justify-between gap-6 overflow-y-auto pt-8.25 pr-2 pb-9.75 pl-4.75"
      style={{
        scrollbarWidth: "thin",
      }}
    >
      <nav className="flex h-full w-full flex-col gap-6">
        {Object.values(navSection).map((section) => (
          <div key={section} className="space-y-4.25">
            <p className="text-xs font-medium tracking-2-percent text-sub-text uppercase">
              {NavSectionLabel[section]}
            </p>
            <ul className="space-y-4.5">
              {navItems
                .filter((item) => item.section === section)
                .map((item) => {
                  const Icon = item.icon;
                  const isParentActive = pathname === item.to;
                  const isExpanded = expandedItems.has(item.label);

                  if (item.subItems) {
                    return (
                      <li key={item.label}>
                        <button
                          type="button"
                          className="group flex w-full cursor-pointer items-center gap-4.25"
                          data-active={isParentActive}
                          onClick={() => toggleExpanded(item.label)}
                        >
                          <div className="w-1.75 self-stretch rounded-full bg-transparent transition-colors group-data-[active='true']:bg-active" />
                          <div className="flex flex-1 items-center gap-2.75 pt-1.25 pb-2.5">
                            {Icon && (
                              <Icon
                                className={`size-3.75 shrink-0 transition-colors group-data-[active='true']:text-active`}
                              />
                            )}
                            <span className="flex-1 text-sm font-normal tracking-2-percent transition-colors group-data-[active='true']:font-bold group-data-[active='true']:text-active">
                              {item.label}
                            </span>
                            <ChevronDown
                              className={`size-3.75 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </div>
                        </button>

                        {isExpanded && (
                          <ul className="mt-1 ml-6 space-y-1">
                            {item.subItems.map((subItem) => {
                              const isSubActive =
                                isParentActive && searchTab === subItem.tab;
                              return (
                                <li key={subItem.tab}>
                                  <Link
                                    to={item.to ?? "/"}
                                    search={{ tab: subItem.tab }}
                                    className={`block rounded px-3 py-1.5 text-sm tracking-2-percent transition-colors hover:text-active ${
                                      isSubActive
                                        ? "font-bold text-active"
                                        : "font-normal"
                                    }`}
                                  >
                                    {subItem.label}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  }

                  return (
                    <li
                      key={item.label}
                      className="group flex items-center gap-4.25"
                      data-active={isParentActive}
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
      </nav>
      <ModeToggle />
    </div>
  );
}
