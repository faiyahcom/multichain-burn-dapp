import AdminMasterPoolManagementSearch from "@/views/admin/master-pool-management/search";
import AdminMasterPoolManagementTable from "@/views/admin/master-pool-management/table";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/admin/master-pool-management/")({
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
            <AdminMasterPoolManagementSearch />
            <AdminMasterPoolManagementTable />
        </div>
    );
}
