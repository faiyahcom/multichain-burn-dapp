import { useAuthStore } from "@/stores/authStore";
import AdminManagementSearch from "@/views/admin/admin-management/search";
import AdminManagementTable from "@/views/admin/admin-management/table";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/admin-management/")({
  beforeLoad: () => {
    if (useAuthStore.getState().user?.role !== "super_admin") {
      throw redirect({ to: "/" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-5.5">
      <AdminManagementSearch />
      <AdminManagementTable />
    </div>
  );
}
