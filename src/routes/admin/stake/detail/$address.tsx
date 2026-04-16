import AdminStakePoolDetail from '@/views/admin/stake/detail';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';

export const Route = createFileRoute('/admin/stake/detail/$address')({
    beforeLoad: () => {
        const role = useAuthStore.getState().user?.role;
        if (role !== 'admin' && role !== 'super_admin') {
            throw redirect({ to: '/' });
        }
    },
    component: RouteComponent,
})

function RouteComponent() {
    const { address } = Route.useParams();
    return <AdminStakePoolDetail address={address} />
}
