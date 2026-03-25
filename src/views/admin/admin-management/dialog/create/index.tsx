import { toast } from "@/components/common/custom-toast";
import { Button } from "@/components/ui/button";
import { adminManagementService } from "@/services/adminManagementService";
import { adminManagementQueryKeys } from "@/services/queries/queryKey";
import { useSystemStore } from "@/stores/systemStore";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { mapChainToSystemNetwork } from "@/utils/helpers/networks";
import { useAppKitAccount } from "@reown/appkit/react";
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
  const { caipAddress } = useAppKitAccount();
  const { openSwitchNetworkModal } = useSystemStore();
  const { toggleAdminRole: toggleAdminRoleEvm } = useToggleAdminRoleEvmFn();
  const { toggleAdminRole: toggleAdminRoleSolana } =
    useToggleAdminRoleSolanaFn();
  const [namespace, chainRef] = caipAddress?.split(":") ?? [];
  const currentNetworkId =
    namespace && chainRef ? mapChainToSystemNetwork(namespace, chainRef) : null;

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
        onClick={() => setOpen(true)}
      >
        Add new Admin
        <PlusIcon className="size-3.75" />
      </Button>

      <AdminManagementDialogForm
        open={open}
        onOpenChange={setOpen}
        title="Add new Admin"
        description="Grant dashboard access and assign an administrator role."
        defaultValues={{
          role: "super_admin",
          networkId: currentNetworkId ?? "ethereumTestnet",
        }}
        isLoading={isPending || isCallingSc}
        onSubmit={async (values) => {
          const targetNetworkId = values.networkId;

          if (!currentNetworkId) {
            toast.error("Connect the correct wallet network before saving.");
            return;
          }

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
        }}
      />
    </>
  );
};

export default AdminManagementDialogCreate;
