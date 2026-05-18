import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import CreateLaunchpadPool from '@/views/admin/launchpad/create'

export const Route = createFileRoute('/admin/launchpad/create/')({
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    if (user?.role !== 'super_admin') {
      throw redirect({ to: '/' })
    }
  },
  component: CreateLaunchpadPool,
})
