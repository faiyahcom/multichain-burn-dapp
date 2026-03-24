import AnimateIconButton from "@/components/common/animate-icon-button";
import BlueSwitch from "@/components/common/blue-switch";
import ConfirmDialog from "@/components/common/confirm-dialog";
import CopyableText from "@/components/common/copyable-text";
import CustomPagination from "@/components/common/pagination";
import TableNoData from "@/components/common/table-no-data";
import TableSpinner from "@/components/common/table-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { adminManagementService } from "@/services/adminManagementService";
import { adminManagementQueryKeys } from "@/services/queries/queryKey";
import { useAdminManagementSearchFilterStore } from "@/stores/admin/admin-management/search-filter-store";
import {
  adminManagementRoleLabels,
  adminManagementStatusColors,
  adminManagementStatusLabels,
  adminManagementStatusLetters,
  type AdminManagementAdmin,
  type AdminManagementStatus,
} from "@/types/admin/admin-management";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { truncateString } from "@/utils/helpers/string";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/common/custom-toast";
import AdminManagementDialogEdit from "../dialog/edit";

const PAGE_SIZE = 5;

const AdminManagementTable = () => {
  const { filter, setFilter } = useAdminManagementSearchFilterStore();
  const queryClient = useQueryClient();
  const [editingAdmin, setEditingAdmin] = useState<AdminManagementAdmin | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<AdminManagementAdmin | null>(
    null,
  );
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: adminManagementQueryKeys.list(filter),
    queryFn: () =>
      adminManagementService.getListAdmins({
        page: filter.page,
        limit: PAGE_SIZE,
        search: filter.text || undefined,
        roles: filter.roles,
        networkIds: filter.network,
      }),
  });

  const { mutateAsync: updateStatus } = useMutation({
    mutationFn: ({
      id,
      enabled,
    }: Pick<AdminManagementAdmin, "id" | "enabled">) =>
      adminManagementService.updateAdminStatus({ id, enabled }),
    onSuccess: async (_, variables) => {
      toast.success(
        `Admin ${variables.enabled ? "enabled" : "disabled"} successfully!`,
      );
      await queryClient.invalidateQueries({
        queryKey: adminManagementQueryKeys.list(filter),
        exact: false,
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage({ error }));
    },
  });

  const { mutate: deleteAdmin, isPending: isDeletePending } = useMutation({
    mutationFn: (id: string) => adminManagementService.deleteAdmin(id),
    onSuccess: async () => {
      toast.success("Admin deleted successfully!");
      await queryClient.invalidateQueries({
        queryKey: adminManagementQueryKeys.list(filter),
        exact: false,
      });
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage({ error }));
    },
  });

  const handleToggleAdminStatus = async (admin: AdminManagementAdmin) => {
    setStatusUpdatingId(admin.id);
    try {
      await updateStatus({
        id: admin.id,
        enabled: !admin.enabled,
      });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <>
      <div className="space-y-10 pb-10 pl-3.75">
        <Table className="table-auto">
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Added</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSpinner isLoading={isPending} colSpan={6} />
            <TableNoData
              colSpan={6}
              data={data?.admins}
              isLoading={isPending}
              text="No admins found"
            />

            {data?.admins.map((admin, index) => {
              const status: AdminManagementStatus = admin.enabled
                ? "enabled"
                : "disabled";
              const isFeaturedRow = index === 0;
              const isStatusLoading = statusUpdatingId === admin.id;

              return (
                <TableRow
                  key={admin.id}
                  className={cn({
                    "bg-inactive/60": isFeaturedRow,
                  })}
                >
                  <TableCell>
                    <div className="flex flex-col pl-2 text-left">
                      <p
                        className={cn("text-base font-semibold", {
                          "text-primary": isFeaturedRow,
                        })}
                      >
                        {admin.name}
                      </p>
                      <p className="text-11px font-normal text-secondary-text">
                        {admin.email}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <AnimateIconButton
                      iconLetter={adminManagementStatusLetters[status]}
                      textVariant="text-self-center"
                      text={adminManagementStatusLabels[status]}
                      color={adminManagementStatusColors[status]}
                      hasGroupHover
                      classNames={{
                        btn: "mx-auto min-w-27",
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <CopyableText
                      content={admin.walletAddress}
                      displayText={truncateString({
                        str: admin.walletAddress,
                      })}
                    />
                  </TableCell>

                  <TableCell>
                    <span
                      className={cn("text-sm font-semibold", {
                        "text-active": admin.role === "superAdmin",
                      })}
                    >
                      {adminManagementRoleLabels[admin.role]}
                    </span>
                  </TableCell>

                  <TableCell>
                    <p
                      className={cn("text-sm whitespace-nowrap", {
                        "text-primary": isFeaturedRow,
                      })}
                    >
                      {new Date(admin.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-center gap-4.5">
                      <button
                        className="text-secondary-text transition-colors hover:text-foreground"
                        onClick={() => setEditingAdmin(admin)}
                      >
                        <PencilIcon className="size-4" />
                      </button>
                      <BlueSwitch
                        active={admin.enabled}
                        isLoading={isStatusLoading}
                        disabled={isStatusLoading}
                        onClick={() => handleToggleAdminStatus(admin)}
                      />
                      <button
                        className="text-secondary-text transition-colors hover:text-destructive"
                        onClick={() => setDeleteTarget(admin)}
                      >
                        <Trash2Icon className="size-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {!isPending && data ? (
          <p className="pl-4 text-sm text-secondary-text">
            Showing {data.admins.length} of {data.total} admins
          </p>
        ) : null}

        <CustomPagination
          currentPage={filter.page}
          totalCount={data?.total ?? 0}
          pageSize={PAGE_SIZE}
          hideIfLessThanTwoPages
          onPageChange={(page) => setFilter({ page })}
        />
      </div>

      {editingAdmin ? (
        <AdminManagementDialogEdit
          admin={editingAdmin}
          open={!!editingAdmin}
          onOpenChange={(open) => {
            if (!open) {
              setEditingAdmin(null);
            }
          }}
        />
      ) : null}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete Admin"
        description="Are you sure you want to remove this admin from the management list?"
        buttonConfirmText="Delete"
        isLoading={isDeletePending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteAdmin(deleteTarget.id);
          }
        }}
      />
    </>
  );
};

export default AdminManagementTable;
