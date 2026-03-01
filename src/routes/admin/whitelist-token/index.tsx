import AdminWhitelistTokenSearch from "@/views/admin/whitelist-token/search";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/whitelist-token/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <AdminWhitelistTokenSearch />
    </>
  );
}
