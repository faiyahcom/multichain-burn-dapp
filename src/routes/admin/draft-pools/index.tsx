import { useAuthStore } from "@/stores/authStore";
import AdminDraftPoolsSearch from "@/views/admin/draft-pools/search";
import AdminDraftPoolsTable from "@/views/admin/draft-pools/table";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/draft-pools/")({
  beforeLoad: () => {
    const role = useAuthStore.getState().user?.role;
    if (role !== "admin" && role !== "super_admin") {
      throw redirect({ to: "/" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-5.5">
      <AdminDraftPoolsSearch />
      <AdminDraftPoolsTable />
    </div>
  );
}
