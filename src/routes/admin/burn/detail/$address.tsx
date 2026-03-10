import AdminBurnPoolDetail from '@/views/admin/burn/detail';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';

export const Route = createFileRoute('/admin/burn/detail/$address')({
    beforeLoad: () => {
        if (useAuthStore.getState().user?.role !== 'admin') {
            throw redirect({ to: '/' });
        }
    },
    component: RouteComponent,
})

function RouteComponent() {
    const { address } = Route.useParams();
    return <AdminBurnPoolDetail address={address} />
}
