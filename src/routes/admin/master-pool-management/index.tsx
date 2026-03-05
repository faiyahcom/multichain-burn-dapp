import AdminMasterPoolManagementSearch from "@/views/admin/master-pool-management/search";
import AdminMasterPoolManagementTable from "@/views/admin/master-pool-management/table";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/master-pool-management/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-5.5">
      <AdminMasterPoolManagementSearch />
      <AdminMasterPoolManagementTable />
    </div>
  );
}
