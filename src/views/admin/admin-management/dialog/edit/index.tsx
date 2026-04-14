import { toast } from "@/components/common/custom-toast";
import { adminManagementService } from "@/services/adminManagementService";
import { adminManagementQueryKeys } from "@/services/queries/queryKey";
import { useAuthStore } from "@/stores/authStore";
import { useSystemStore } from "@/stores/systemStore";
import type { AdminManagementAdmin } from "@/types/admin/admin-management";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToggleAdminRoleEvmFn } from "../../table/useToggleAdminRoleEvmFn";
import { useToggleAdminRoleSolanaFn } from "../../table/useToggleAdminRoleSolanaFn";
import AdminManagementDialogForm, { type AdminManagementFormValues } from "../form";

interface Props {
  admin: AdminManagementAdmin;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSelfAdmin?: boolean;
}

const AdminManagementDialogEdit: React.FC<Props> = ({
  admin,
  open,
  onOpenChange,
  isSelfAdmin = false,
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isCallingSc, setIsCallingSc] = useState(false);
  const currentNetworkId = useSystemStore((state) => state.selectedNetworkId);
  const openSwitchNetworkModal = useSystemStore(
    (state) => state.openSwitchNetworkModal,
  );
  const accessToken = useAuthStore((state) => state.accessToken);
  const { toggleAdminRole: toggleAdminRoleEvm } = useToggleAdminRoleEvmFn();
  const {
    toggleAdminRole: toggleAdminRoleSolana,
    toggleAdminRoles: toggleAdminRolesSolana,
  } =
    useToggleAdminRoleSolanaFn();
  const adminNetworkIds = admin.networkIds ?? [];
  const targetNetworkId =
    adminNetworkIds.length === 1
      ? adminNetworkIds[0]
      : currentNetworkId && adminNetworkIds.includes(currentNetworkId)
        ? currentNetworkId
        : adminNetworkIds[0];

  // Fetch total super admin count to guard against demoting the last one
  const { data: superAdminData } = useQuery({
    queryKey: [...adminManagementQueryKeys.all, "super-admin-count"],
    enabled: open && admin.role === "super_admin" && !!accessToken,
    queryFn: () =>
      adminManagementService.getListAdmins({ roles: ["super_admin"], networkIds: [targetNetworkId], limit: 1 }),
  });
  // Lock the role selector if this admin is the only super admin
  const isSoleSuperAdmin =
    admin.role === "super_admin" && (superAdminData?.total ?? 0) <= 1;

  const { mutateAsync: updateAdmin, isPending } = useMutation({
    mutationFn: adminManagementService.updateAdmin,
    onSuccess: (updatedAdmin) => {
      if (!isSelfAdmin) {
        return;
      }

      useAuthStore.setState((state) => ({
        user: state.user
          ? {
            ...state.user,
            role: updatedAdmin.role,
          }
          : state.user,
      }));
    },
  });

  const syncSelfRoleToStore = (role: AdminManagementAdmin["role"]) => {
    if (!isSelfAdmin) {
      return;
    }

    useAuthStore.setState((state) => ({
      user: state.user
        ? {
          ...state.user,
          role,
        }
        : state.user,
    }));
  };

  const redirectSelfOutOfAdminManagement = async (
    role: AdminManagementAdmin["role"],
  ) => {
    syncSelfRoleToStore(role);
    onOpenChange(false);
    queryClient.removeQueries({
      queryKey: adminManagementQueryKeys.all,
      exact: false,
    });
    await navigate({ to: "/", replace: true });
  };

  const handleSubmit = async (values: AdminManagementFormValues) => {
    if (!targetNetworkId) {
      toast.error("Cannot determine network for this admin.");
      return;
    }

    if (currentNetworkId !== targetNetworkId) {
      openSwitchNetworkModal(currentNetworkId, targetNetworkId);
      return;
    }

    const roleChanged = values.role !== admin.role;
    const isSelfDemotedFromSuperAdmin =
      isSelfAdmin &&
      admin.role === "super_admin" &&
      values.role === "admin";
    const isEvmAdminPromotedToSuperAdmin =
      targetNetworkId !== "solana" &&
      admin.role === "admin" &&
      values.role === "super_admin";
    const shouldDisablePreviousRole =
      !isSelfDemotedFromSuperAdmin && !isEvmAdminPromotedToSuperAdmin;
    let didSelfDemoteOnChain = false;

    setIsCallingSc(true);
    try {
      if (roleChanged && admin.enabled) {
        const shouldBatchSolanaRoleSwap =
          targetNetworkId === "solana" && shouldDisablePreviousRole;

        if (shouldBatchSolanaRoleSwap) {
          const isRoleSwapped = await toggleAdminRolesSolana([
            {
              walletAddress: admin.walletAddress,
              enabled: true,
              role: values.role,
            },
            {
              walletAddress: admin.walletAddress,
              enabled: false,
              role: admin.role,
            },
          ]);

          if (!isRoleSwapped) {
            return;
          }
        } else {
          const enableNextRole =
            targetNetworkId === "solana"
              ? await toggleAdminRoleSolana({
                walletAddress: admin.walletAddress,
                enabled: true,
                role: values.role,
              })
              : await toggleAdminRoleEvm({
                walletAddress: admin.walletAddress,
                enabled: true,
                role: values.role,
              });

          if (!enableNextRole) {
            return;
          }

          if (isSelfDemotedFromSuperAdmin) {
            didSelfDemoteOnChain = true;
          }

          if (shouldDisablePreviousRole) {
            const disablePreviousRole =
              targetNetworkId === "solana"
                ? await toggleAdminRoleSolana({
                  walletAddress: admin.walletAddress,
                  enabled: false,
                  role: admin.role,
                })
                : await toggleAdminRoleEvm({
                  walletAddress: admin.walletAddress,
                  enabled: false,
                  role: admin.role,
                });

            if (!disablePreviousRole) {
              return;
            }
          }
        }
      }

      const updatedAdmin = await updateAdmin({
        ...values,
        id: admin.id,
        networkId: targetNetworkId,
        enabled: admin.enabled,
      });
      const isSelfDemoted = isSelfAdmin && updatedAdmin.role !== "super_admin";

      toast.success("Admin updated successfully!");
      onOpenChange(false);

      if (isSelfDemoted) {
        queryClient.removeQueries({
          queryKey: adminManagementQueryKeys.all,
          exact: false,
        });
        await navigate({ to: "/" });
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: adminManagementQueryKeys.all,
        exact: false,
      });
    } catch (error) {
      if (didSelfDemoteOnChain) {
        await redirectSelfOutOfAdminManagement(values.role);
        return;
      }

      toast.error(getErrorMessage({ error }));
    } finally {
      setIsCallingSc(false);
    }
  };

  return (
    <AdminManagementDialogForm
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Admin"
      submitText="Save Changes"
      description={
        isSelfAdmin
          ? "Update your name, email, or role. Your wallet and network stay locked for safety."
          : "Update the assigned role or contact details for this admin."
      }
      defaultValues={{
        name: admin.name,
        email: admin.email,
        walletAddress: admin.walletAddress,
        networkId: targetNetworkId,
        role: admin.role,
      }}
      lockWalletAddress
      lockNetworkId
      lockRole={isSoleSuperAdmin}
      isLoading={isPending || isCallingSc}
      onSubmit={handleSubmit}
    />
  );
};

export default AdminManagementDialogEdit;
