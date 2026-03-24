import AdminWhitelistUserSearch from "@/views/admin/whitelist-user/search";
import AdminWhitelistUserTable from "@/views/admin/whitelist-user/table";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/admin/whitelist-user/")({
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
            <AdminWhitelistUserSearch />
            <AdminWhitelistUserTable />
        </div>
    );
}
