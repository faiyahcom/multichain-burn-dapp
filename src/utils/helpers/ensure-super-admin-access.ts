import { authService, isSuperAdminRole } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import { getErrorMessage } from "@/utils/helpers/error-message";

type EnsureLatestSuperAdminAccessResult =
  | { ok: true }
  | { ok: false; message: string };

export const ensureLatestSuperAdminAccess = async ({
  forbiddenMessage = "Only super admin can perform this action.",
}: {
  forbiddenMessage?: string;
} = {}): Promise<EnsureLatestSuperAdminAccessResult> => {
  try {
    const latestUser = await authService.getCurrentUser();

    useAuthStore.setState((state) => ({
      user: state.user
        ? {
            ...state.user,
            id: latestUser.id,
            address: latestUser.address || state.user.address,
            role: latestUser.role,
          }
        : {
            id: latestUser.id,
            address: latestUser.address,
            role: latestUser.role,
          },
    }));

    if (!isSuperAdminRole(latestUser)) {
      return {
        ok: false,
        message: forbiddenMessage,
      };
    }

    return { ok: true };
  } catch (error) {
    if ((error as { status?: number })?.status === 401) {
      return {
        ok: false,
        message: "Please sign in again.",
      };
    }

    return {
      ok: false,
      message: getErrorMessage({ error }),
    };
  }
};
