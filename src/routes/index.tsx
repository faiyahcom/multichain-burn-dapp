import { authService } from "@/services/authService";
import { authQueryKeys } from "@/services/queries/queryKey";
import { useAuthStore } from "@/stores/authStore";
import AdminHome from "@/views/admin/home";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { user, accessToken, _hasHydrated } = useAuthStore();

  const { data: userApiData, isEnabled: isUserApiDataEnabled } = useQuery({
    queryKey: authQueryKeys.me({
      id: user?.id,
    }),
    queryFn: async () => {
      return authService.getCurrentUser();
    },
    enabled: !!accessToken && _hasHydrated,
  });

  const showAdminDashboard =
    _hasHydrated &&
    isUserApiDataEnabled &&
    !!userApiData &&
    (userApiData.role === "admin" || userApiData.role === "super_admin");

  if (showAdminDashboard) {
    return <AdminHome />;
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2.25 text-center">
      <h1 className="text-40px font-extrabold">WELCOME TO FAIYAH.COM</h1>
      <p className="text-2xl font-normal">Your Gateway to DeFi Services</p>
    </div>
  );
}
