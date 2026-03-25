import { toast } from "@/components/common/custom-toast";
import { adminManagementService } from "@/services/adminManagementService";
import { adminManagementQueryKeys } from "@/services/queries/queryKey";
import { useSystemStore } from "@/stores/systemStore";
import type { AdminManagementAdmin } from "@/types/admin/admin-management";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToggleAdminRoleEvmFn } from "../../table/useToggleAdminRoleEvmFn";
import { useToggleAdminRoleSolanaFn } from "../../table/useToggleAdminRoleSolanaFn";
import AdminManagementDialogForm, { type AdminManagementFormValues } from "../form";

interface Props {
  admin: AdminManagementAdmin;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdminManagementDialogEdit: React.FC<Props> = ({
  admin,
  open,
  onOpenChange,
}) => {
  const queryClient = useQueryClient();
  const [isCallingSc, setIsCallingSc] = useState(false);
  const currentNetworkId = useSystemStore((state) => state.selectedNetworkId);
  const openSwitchNetworkModal = useSystemStore(
    (state) => state.openSwitchNetworkModal,
  );
  const { toggleAdminRole: toggleAdminRoleEvm } = useToggleAdminRoleEvmFn();
  const { toggleAdminRole: toggleAdminRoleSolana } =
    useToggleAdminRoleSolanaFn();
  const targetNetworkId =
    admin.networkIds.length === 1
      ? admin.networkIds[0]
      : currentNetworkId && admin.networkIds.includes(currentNetworkId)
        ? currentNetworkId
        : admin.networkIds[0];

  const { mutateAsync: updateAdmin, isPending } = useMutation({
    mutationFn: adminManagementService.updateAdmin,
    onSuccess: async () => {
      toast.success("Admin updated successfully!");
      await queryClient.invalidateQueries({
        queryKey: adminManagementQueryKeys.all,
        exact: false,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage({ error }));
    },
  });

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

    setIsCallingSc(true);
    try {
      if (roleChanged && admin.enabled) {
        const enableNextRole =
          targetNetworkId === "solanaDevnet"
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

        const disablePreviousRole =
          targetNetworkId === "solanaDevnet"
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

      await updateAdmin({
        ...values,
        id: admin.id,
        networkId: targetNetworkId,
        enabled: admin.enabled,
      });
    } finally {
      setIsCallingSc(false);
    }
  };

  return (
    <AdminManagementDialogForm
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Admin"
      description="Update the assigned role or contact details for this admin."
      defaultValues={{
        name: admin.name,
        email: admin.email,
        walletAddress: admin.walletAddress,
        networkId: targetNetworkId,
        role: admin.role,
      }}
      lockWalletAddress
      lockNetworkId
      isLoading={isPending || isCallingSc}
      onSubmit={handleSubmit}
    />
  );
};

export default AdminManagementDialogEdit;
