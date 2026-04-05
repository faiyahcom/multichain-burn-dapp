import { redirect } from "@tanstack/react-router";
import {
  authService,
  hasEnabledAdminRole,
  isSuperAdminRole,
} from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

type RequireAdminAccessOptions = {
  superAdminOnly?: boolean;
};

const redirectHome = () => redirect({ to: "/" });

const syncCurrentUserToStore = async () => {
  const currentUser = await authService.getCurrentUser();
  const { accessToken, login, user } = useAuthStore.getState();

  if (accessToken && user) {
    login({
      user: {
        ...user,
        id: currentUser.id,
        address: currentUser.address || user.address,
        role: currentUser.role,
      },
      accessToken,
    });
  }

  return currentUser;
};

export const requireLatestAdminAccess = async ({
  superAdminOnly = false,
}: RequireAdminAccessOptions = {}) => {
  const { accessToken } = useAuthStore.getState();

  if (!accessToken) {
    throw redirectHome();
  }

  let currentUser;

  try {
    currentUser = await syncCurrentUserToStore();
  } catch {
    throw redirectHome();
  }

  const hasAccess = superAdminOnly
    ? isSuperAdminRole(currentUser)
    : hasEnabledAdminRole(currentUser);

  if (!hasAccess) {
    throw redirectHome();
  }

  return currentUser;
};
