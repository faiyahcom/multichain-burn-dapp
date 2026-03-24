import { toast } from "@/components/common/custom-toast";
import { adminManagementService } from "@/services/adminManagementService";
import { adminManagementQueryKeys } from "@/services/queries/queryKey";
import { useAdminManagementSearchFilterStore } from "@/stores/admin/admin-management/search-filter-store";
import type { AdminManagementAdmin } from "@/types/admin/admin-management";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AdminManagementDialogForm, {
  type AdminManagementFormValues,
} from "../form";

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
  const { filter } = useAdminManagementSearchFilterStore();

  const { mutateAsync: updateAdmin, isPending } = useMutation({
    mutationFn: (values: AdminManagementFormValues) =>
      adminManagementService.updateAdmin({
        id: admin.id,
        networkIds: admin.networkIds,
        ...values,
      }),
    onSuccess: async () => {
      toast.success("Admin updated successfully!");
      await queryClient.invalidateQueries({
        queryKey: adminManagementQueryKeys.list(filter),
        exact: false,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage({ error }));
    },
  });

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
        role: admin.role,
      }}
      lockWalletAddress
      isLoading={isPending}
      onSubmit={async (values) => {
        await updateAdmin(values);
      }}
    />
  );
};

export default AdminManagementDialogEdit;
