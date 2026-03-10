import AdminWhitelistTokenSearch from "@/views/admin/whitelist-token/search";
import AdminWhitelistTokenTable from "@/views/admin/whitelist-token/table";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/admin/whitelist-token/")({
    beforeLoad: () => {
        if (useAuthStore.getState().user?.role !== "admin") {
            throw redirect({ to: "/" });
        }
    },
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
