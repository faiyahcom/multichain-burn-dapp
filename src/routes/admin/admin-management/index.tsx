import AdminManagementSearch from "@/views/admin/admin-management/search";
import AdminManagementTable from "@/views/admin/admin-management/table";
import { createFileRoute } from "@tanstack/react-router";
import { requireLatestAdminAccess } from "@/utils/helpers/admin-access";

export const Route = createFileRoute("/admin/admin-management/")({
  beforeLoad: async () => {
    await requireLatestAdminAccess({ superAdminOnly: true });
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
