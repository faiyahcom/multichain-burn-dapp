import { useAuthStore } from "@/stores/authStore";
import AdminMinRatioForm from "@/views/admin/min-ratio/form";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/min-ratio/create/")({
  beforeLoad: () => {
    const role = useAuthStore.getState().user?.role;
    if (role !== "super_admin") {
      throw redirect({ to: "/" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <AdminMinRatioForm />;
}
