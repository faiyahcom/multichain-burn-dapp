import { createFileRoute } from "@tanstack/react-router";
import FeeSettingsManagement from "@/views/admin/fee-settings-management";
import { requireLatestAdminAccess } from "@/utils/helpers/admin-access";

export const Route = createFileRoute("/admin/fee-settings-management/")({
  beforeLoad: async () => {
    await requireLatestAdminAccess({ superAdminOnly: true });
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <FeeSettingsManagement />;
}
