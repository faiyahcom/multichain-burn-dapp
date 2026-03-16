import { Link, useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ModeToggle } from "../../shared/theme/mode-toggle";
import { navItems, navSection, NavSectionLabel } from "./const";
import { useAuthStore } from "@/stores/authStore";



export function Sidebar() {
    const { user } = useAuthStore();
    const isAdmin = user?.role === "admin";
    const { pathname, searchStr } = useLocation({
        select: (location) => ({
            pathname: location.pathname,
            searchStr: location.searchStr ?? "",
        }),
    });

    const [openItems, setOpenItems] = useState<Set<string>>(() => {
        const initial = new Set<string>();
        navItems.forEach((item) => {
            if (item.children && item.to && pathname.startsWith(item.to)) {
                initial.add(item.label);
            }
        });
        return initial;
    });

    useEffect(() => {
        navItems.forEach((item) => {
            if (item.children && item.to && pathname.startsWith(item.to)) {
                setOpenItems((prev) => {
                    if (prev.has(item.label)) return prev;
                    return new Set([...prev, item.label]);
                });
            }
        });
    }, [pathname]);

    const toggleItem = (label: string) => {
        setOpenItems((prev) => {
            const next = new Set(prev);
            if (next.has(label)) {
                next.delete(label);
            } else {
                next.add(label);
            }
            return next;
        });
    };

    return (
        <div
            className="flex h-full max-h-full w-70 flex-col justify-between gap-6 overflow-y-auto pt-8.25 pr-2 pb-9.75 pl-4.75"
            style={{
                scrollbarWidth: "thin",
            }}
        >
            <nav className="flex h-full w-full flex-col gap-6">
                {Object.values(navSection).filter((section) => section !== navSection.admin || isAdmin).map((section, sectionIndex) => (
                    <div key={sectionIndex} className="space-y-4.25">
                        <p className="text-xs font-medium tracking-2-percent text-sub-text uppercase">
                            {NavSectionLabel[section]}
                        </p>
                        <ul className="space-y-4.5">
                            {navItems
                                .filter((item) => item.section === section)
                                .map((item, itemIndex) => {
                                    const Icon = item.icon;
                                    const hasChildren = !!item.children?.length;
                                    const isExpanded = openItems.has(item.label);
                                    const isActive = hasChildren
                                        ? !!(item.to && pathname.startsWith(item.to))
                                        : pathname === item.to;

                                    return (
                                        <li key={itemIndex}>
                                            <div
                                                className="group flex items-center gap-4.25"
                                                data-active={isActive}
                                            >
                                                <div className="w-1.75 self-stretch rounded-full bg-transparent transition-colors group-data-[active='true']:bg-active" />
                                                <div className="flex flex-1 items-center gap-2.75 pt-1.25 pb-2.5">
                                                    {Icon && (
                                                        <Icon
                                                            className={`size-3.75 shrink-0 transition-colors group-data-[active='true']:text-active`}
                                                        />
                                                    )}
                                                    <span className="flex-1 text-sm font-normal tracking-2-percent transition-colors group-data-[active='true']:font-bold group-data-[active='true']:text-active">
                                                        {hasChildren ? (
                                                            <Link
                                                                to={item.to! as any}
                                                                search={{ tab: item.children![0].tab } as any}
                                                                className="flex w-full items-center justify-between"
                                                                onClick={() => toggleItem(item.label)}
                                                            >
                                                                <span>{item.label}</span>
                                                            </Link>
                                                        ) : item.to ? (
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
                                            </div>

                                            {hasChildren && isExpanded && (
                                                <ul className="ml-8 mt-1 space-y-1">
                                                    {item.children!.map((child, childIndex) => {
                                                        const isChildActive =
                                                            !!(item.to && pathname.startsWith(item.to)) &&
                                                            new URLSearchParams(searchStr).get("tab") ===
                                                            child.tab;
                                                        return (
                                                            <li key={childIndex}>
                                                                <Link
                                                                    to={item.to! as any}
                                                                    search={{ tab: child.tab } as any}
                                                                    className={`block py-1.5 pl-2 text-sm tracking-2-percent transition-colors hover:text-active ${isChildActive
                                                                            ? "font-bold text-active"
                                                                            : "font-normal"
                                                                        }`}
                                                                >
                                                                    {child.label}
                                                                </Link>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
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
