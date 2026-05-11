import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { authService } from "@/services/authService";
import { authQueryKeys } from "@/services/queries/queryKey";
import { useSidebarStateStore } from "@/stores/admin/sidebar/sidebar-store";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "@tanstack/react-router";
import {
  adminNavItems,
  navSection,
  NavSectionLabel,
  type NavItem,
} from "./const";
import { useSidebarOpenedChildStore } from "@/stores/sideStore";
import { useEffect } from "react";

interface AdminNavItemProps {
  navItem: NavItem;
  isActive?: boolean;
  onClick?: () => void;
}

const AdminNavItem: React.FC<AdminNavItemProps> = ({
  navItem,
  isActive,
  onClick,
}) => {
  const { tab } = useSearch({ strict: false });
  const Icon = navItem.icon;
  const { openedChild, setOpenedChild } = useSidebarOpenedChildStore();
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    if (pathname === navItem.to && !openedChild.includes(navItem.label)) {
      setOpenedChild(navItem.label);
    }
  }, [pathname]);

  return (
    <li
      onClick={() => {
        onClick?.();
        if (!openedChild.includes(navItem.label)) {
          setOpenedChild(navItem.label);
        }
      }}
    >
      <div className="group flex items-center gap-4.25" data-active={isActive}>
        <div className="w-1.75 self-stretch rounded-full bg-transparent transition-colors group-data-[active='true']:bg-active" />
        <div className="flex flex-1 items-center gap-2.75 pt-1.25 pb-2.5">
          {Icon && (
            <Icon
              className={`size-3.75 shrink-0 transition-colors group-data-[active='true']:text-active`}
            />
          )}
          <span className="flex-1 text-sm font-normal tracking-2-percent transition-colors group-data-[active='true']:font-bold group-data-[active='true']:text-active">
            {navItem.to ? (
              <Link to={navItem.to}>
                <span>{navItem.label}</span>
              </Link>
            ) : (
              <div>
                <span>{navItem.label}</span>
              </div>
            )}
          </span>
        </div>
      </div>
      {navItem.children &&
        navItem.children.length > 0 &&
        openedChild.includes(navItem.label) && (
          <ul>
            {navItem.children.map((child, index) => {
              const ChildIcon = child.icon;
              const isChildActive = isActive && tab === child.tab;
              return (
                <li
                  key={`${child.tab}-${index}`}
                  className="group flex items-center gap-3 py-2.25 pl-10.75"
                  data-child-active={isChildActive}
                  onClick={() => {
                    onClick?.();
                  }}
                >
                  {ChildIcon && (
                    <ChildIcon className="w-4 shrink-0 transition-colors group-data-[child-active='true']:text-active" />
                  )}
                  <span className="flex-1 text-sm font-normal tracking-2-percent transition-colors group-data-[child-active='true']:font-bold group-data-[child-active='true']:text-active">
                    {child.tab ? (
                      <Link
                        to={navItem.to}
                        search={
                          {
                            tab: child.tab,
                          } as any // This is the only way to make TS happy without adding tab to root route
                        }
                      >
                        <span>{child.label}</span>
                      </Link>
                    ) : (
                      <div>
                        <span>{child.label}</span>
                      </div>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
    </li>
  );
};

export const AdminSidebar = () => {
  const { user, accessToken, _hasHydrated } = useAuthStore();
  const location = useLocation();
  const pathname = location.pathname;

  const { data: userApiData, isEnabled: isUserApiDataEnabled } = useQuery({
    queryKey: authQueryKeys.me({
      id: user?.id,
    }),
    queryFn: async () => {
      return authService.getCurrentUser();
    },
    enabled: !!accessToken && _hasHydrated,
  });

  return (
    <div
      className="hidden h-full max-h-full w-70 shrink-0 flex-col justify-between gap-6 overflow-y-auto pt-8.25 pr-2 pb-9.75 pl-4.75 xl:flex"
      style={{
        scrollbarWidth: "thin",
      }}
    >
      <nav className="flex h-full w-full flex-col gap-6">
        <div className="space-y-4.25">
          <p className="text-xs font-medium tracking-2-percent text-sub-text uppercase">
            {NavSectionLabel[navSection.admin]}
          </p>
          <ul className="space-y-4.5">
            {isUserApiDataEnabled &&
              userApiData &&
              adminNavItems
                .filter(
                  (navItem) =>
                    navItem.allowedRoles && // has role check
                    userApiData?.role && // has user role from api
                    navItem.allowedRoles.includes(userApiData.role), // role check
                )
                .map((navItem, index) => {
                  const isActive = pathname === navItem.to;

                  return (
                    <AdminNavItem
                      key={index}
                      navItem={navItem}
                      isActive={isActive}
                    />
                  );
                })}
          </ul>
        </div>
      </nav>
    </div>
  );
};

export const AdminMobileSidebar = () => {
  const { state, setState } = useSidebarStateStore();
  const { user, accessToken, _hasHydrated } = useAuthStore();
  const location = useLocation();
  const pathname = location.pathname;

  const { data: userApiData } = useQuery({
    queryKey: authQueryKeys.me({
      id: user?.id,
    }),
    queryFn: async () => {
      return authService.getCurrentUser();
    },
    enabled: !!accessToken && _hasHydrated,
  });

  return (
    <Sheet
      open={state.isOpen}
      onOpenChange={(open) => {
        setState({ isOpen: open });
      }}
    >
      <SheetContent className="xl:hidden" side="left" showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>{NavSectionLabel[navSection.admin]}</SheetTitle>
          <SheetDescription className="sr-only">
            {NavSectionLabel[navSection.admin]}
          </SheetDescription>
        </SheetHeader>
        <ul className="space-y-4.5">
          {adminNavItems
            .filter(
              (navItem) =>
                navItem.allowedRoles && // has role check
                userApiData?.role && // has user role from api
                navItem.allowedRoles.includes(userApiData.role), // role check
            )
            .map((navItem, index) => {
              const isActive = pathname === navItem.to;

              return (
                <AdminNavItem
                  key={index}
                  navItem={navItem}
                  isActive={isActive}
                  onClick={() => {
                    setState({ isOpen: false });
                  }}
                />
              );
            })}
        </ul>
      </SheetContent>
    </Sheet>
  );
};
