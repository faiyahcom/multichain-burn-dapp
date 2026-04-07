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
import { Link, useLocation } from "@tanstack/react-router";
import {
  adminNavItems,
  navSection,
  NavSectionLabel,
  type NavItem,
} from "./const";

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
  const Icon = navItem.icon;
  return (
    <li onClick={onClick}>
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
    </li>
  );
};

export const AdminSidebar = () => {
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
