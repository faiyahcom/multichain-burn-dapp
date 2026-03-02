import AdminWhitelistTokenSearch from "@/views/admin/whitelist-token/search";
import AdminWhitelistTokenTable from "@/views/admin/whitelist-token/table";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/whitelist-token/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-5.5">
      <AdminWhitelistTokenSearch />
      <AdminWhitelistTokenTable />
    </div>
  );
}
