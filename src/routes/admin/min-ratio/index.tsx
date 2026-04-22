import { useAuthStore } from "@/stores/authStore";
import AdminMinRatioSearch from "@/views/admin/min-ratio/search";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/min-ratio/")({
  beforeLoad: () => {
    const role = useAuthStore.getState().user?.role;
    if (role !== "super_admin") {
      throw redirect({ to: "/" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-5.5">
      <AdminMinRatioSearch />
    </div>
  );
}
