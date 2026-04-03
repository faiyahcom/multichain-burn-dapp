import { authService } from "@/services/authService";
import { authQueryKeys } from "@/services/queries/queryKey";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { adminNavItems, navSection, NavSectionLabel } from "./const";
import { Link, useLocation } from "@tanstack/react-router";

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
      className="hidden xl:flex h-full max-h-full w-70 shrink-0 flex-col justify-between gap-6 overflow-y-auto pt-8.25 pr-2 pb-9.75 pl-4.75"
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
                const Icon = navItem.icon;

                return (
                  <li key={index}>
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
              })}
          </ul>
        </div>
      </nav>
    </div>
  );
};
