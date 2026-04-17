import { toast } from "@/components/common/custom-toast";
import { Button } from "@/components/ui/button";
import { adminManagementService } from "@/services/adminManagementService";
import { adminManagementQueryKeys } from "@/services/queries/queryKey";
import { useSystemStore } from "@/stores/systemStore";
import { ensureLatestSuperAdminAccess } from "@/utils/helpers/ensure-super-admin-access";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useToggleAdminRoleEvmFn } from "../../table/useToggleAdminRoleEvmFn";
import { useToggleAdminRoleSolanaFn } from "../../table/useToggleAdminRoleSolanaFn";
import AdminManagementDialogForm from "../form";

const AdminManagementDialogCreate = () => {
  const [open, setOpen] = useState(false);
  const [isCallingSc, setIsCallingSc] = useState(false);
  const queryClient = useQueryClient();
  const currentNetworkId = useSystemStore((state) => state.selectedNetworkId);
  const openSwitchNetworkModal = useSystemStore(
    (state) => state.openSwitchNetworkModal,
  );
  const { toggleAdminRole: toggleAdminRoleEvm } = useToggleAdminRoleEvmFn();
  const { toggleAdminRole: toggleAdminRoleSolana } =
    useToggleAdminRoleSolanaFn();

  const { mutateAsync: createAdmin, isPending } = useMutation({
    mutationFn: adminManagementService.createAdmin,
    onSuccess: async () => {
      toast.success("Admin created successfully!");
      await queryClient.invalidateQueries({
        queryKey: adminManagementQueryKeys.all,
        exact: false,
      });
      setOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage({ error }));
    },
  });

  return (
    <>
      <Button
        variant="mb-primary"
        size="mb-square-btn"
        onClick={async () => {
          const access = await ensureLatestSuperAdminAccess({
            forbiddenMessage: "Only super admin can create new admins.",
          });

          if (!access.ok) {
            toast.error(access.message);
            return;
          }

          setOpen(true);
        }}
      >
        <span className="max-md:sr-only">Add new Admin</span>
        <PlusIcon className="size-3.75" />
      </Button>

      <AdminManagementDialogForm
        open={open}
        onOpenChange={setOpen}
        title="Add new Admin"
        submitText="Create"
        loadingText="Creating..."
        defaultValues={{
          role: "super_admin",
          networkId: currentNetworkId ?? "ethereum",
        }}
        isLoading={isPending || isCallingSc}
        onSubmit={async (values) => {
          const access = await ensureLatestSuperAdminAccess({
            forbiddenMessage: "Only super admin can create new admins.",
          });

          if (!access.ok) {
            toast.error(access.message);
            return;
          }

          const targetNetworkId = values.networkId;
          const isExistingAdmin =
            await adminManagementService.checkExistingAdmin({
              walletAddress: values.walletAddress,
              networkId: targetNetworkId,
            });

          if (isExistingAdmin) {
            toast.error(
              "This wallet address already exists on the selected network.",
            );
            return;
          }

          if (currentNetworkId !== targetNetworkId) {
            openSwitchNetworkModal(currentNetworkId, targetNetworkId);
            return;
          }

          setIsCallingSc(true);
          try {
            const isUpdated =
              targetNetworkId === "solana"
                ? await toggleAdminRoleSolana({
                    walletAddress: values.walletAddress,
                    enabled: true,
                    role: values.role,
                  })
                : await toggleAdminRoleEvm({
                    walletAddress: values.walletAddress,
                    enabled: true,
                    role: values.role,
                  });

            if (!isUpdated) {
              return;
            }

            await createAdmin({
              ...values,
              networkId: targetNetworkId,
              enabled: true,
            });
          } finally {
            setIsCallingSc(false);
          }
        }}
      />
    </>
  );
};

export default AdminManagementDialogCreate;
