import AdminWhitelistUserSearch from "@/views/admin/whitelist-user/search";
import AdminWhitelistUserTable from "@/views/admin/whitelist-user/table";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/whitelist-user/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-5.5">
      <AdminWhitelistUserSearch />
      <AdminWhitelistUserTable />
    </div>
  );
}
