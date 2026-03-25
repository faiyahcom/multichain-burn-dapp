import { toast } from "@/components/common/custom-toast";
import { Button } from "@/components/ui/button";
import { adminManagementService } from "@/services/adminManagementService";
import { adminManagementQueryKeys } from "@/services/queries/queryKey";
import { useAuthStore } from "@/stores/authStore";
import { useSystemStore } from "@/stores/systemStore";
import { areWalletAddressesEqual } from "@/utils/helpers/address";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useToggleAdminRoleEvmFn } from "../../table/useToggleAdminRoleEvmFn";
import { useToggleAdminRoleSolanaFn } from "../../table/useToggleAdminRoleSolanaFn";
import AdminManagementDialogForm, { type AdminManagementFormValues } from "../form";

const SELF_ADMIN_CREATE_ERROR =
  "You can't create a new admin entry for your own wallet.";

const AdminManagementDialogCreate = () => {
  const [open, setOpen] = useState(false);
  const [isCallingSc, setIsCallingSc] = useState(false);
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
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

  const handleSubmit = async (values: AdminManagementFormValues) => {
    if (areWalletAddressesEqual(user?.address, values.walletAddress)) {
      toast.error(SELF_ADMIN_CREATE_ERROR);
      return;
    }

    const targetNetworkId = values.networkId;

    if (currentNetworkId !== targetNetworkId) {
      openSwitchNetworkModal(currentNetworkId, targetNetworkId);
      return;
    }

    setIsCallingSc(true);
    try {
      const isUpdated =
        targetNetworkId === "solanaDevnet"
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
  };

  return (
    <>
      <Button
        variant="mb-primary"
        size="mb-square-btn"
        onClick={() => setOpen(true)}
      >
        Add new Admin
        <PlusIcon className="size-3.75" />
      </Button>

      <AdminManagementDialogForm
        open={open}
        onOpenChange={setOpen}
        title="Add new Admin"
        defaultValues={{
          role: "super_admin",
          networkId: currentNetworkId ?? "ethereumTestnet",
        }}
        isLoading={isPending || isCallingSc}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default AdminManagementDialogCreate;
