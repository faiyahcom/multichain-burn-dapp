import { toast } from "@/components/common/custom-toast";
import { Button } from "@/components/ui/button";
import { adminManagementService } from "@/services/adminManagementService";
import { adminManagementQueryKeys } from "@/services/queries/queryKey";
import { useAdminManagementSearchFilterStore } from "@/stores/admin/admin-management/search-filter-store";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import AdminManagementDialogForm, {
  type AdminManagementFormValues,
} from "../form";

const AdminManagementDialogCreate = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { filter } = useAdminManagementSearchFilterStore();

  const { mutateAsync: createAdmin, isPending } = useMutation({
    mutationFn: (values: AdminManagementFormValues) =>
      adminManagementService.createAdmin(values),
    onSuccess: async () => {
      toast.success("Admin created successfully!");
      await queryClient.invalidateQueries({
        queryKey: adminManagementQueryKeys.list(filter),
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
        defaultValues={{ role: "superAdmin" }}
        isLoading={isPending}
        onSubmit={async (values) => {
          await createAdmin(values);
        }}
      />
    </>
  );
};

export default AdminManagementDialogCreate;
