import AnimateIconButton from "@/components/common/animate-icon-button";
import BlueSwitch from "@/components/common/blue-switch";
import ConfirmDialog from "@/components/common/confirm-dialog";
import CopyableText from "@/components/common/copyable-text";
import CustomPagination from "@/components/common/pagination";
import NetworkDisplay from "@/components/common/network-display";
import { networkIdToChainId, type NetworkId } from "@/config/networks";
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
import { useAuthStore } from "@/stores/authStore";
import { useSystemStore } from "@/stores/systemStore";
import {
  adminManagementRoleLabels,
  adminManagementStatusColors,
  adminManagementStatusLabels,
  adminManagementStatusLetters,
  type AdminManagementAdmin,
  type AdminManagementStatus,
} from "@/types/admin/admin-management";
import { isEvmAddress } from "@/utils/helpers/address";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { truncateString } from "@/utils/helpers/string";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/common/custom-toast";
import AdminManagementDialogEdit from "../dialog/edit";
import { useToggleAdminRoleEvmFn } from "./useToggleAdminRoleEvmFn";
import { useToggleAdminRoleSolanaFn } from "./useToggleAdminRoleSolanaFn";

const PAGE_SIZE = 10;
const SELF_ADMIN_ACTION_ERROR =
  "You can't modify your own admin access.";
const ADMIN_NETWORK_ERROR = "Cannot determine network for this admin.";

const areWalletAddressesEqual = (left?: string, right?: string) => {
  if (!left || !right) {
    return false;
  }

  const normalizedLeft = left.trim();
  const normalizedRight = right.trim();

  if (isEvmAddress(normalizedLeft) && isEvmAddress(normalizedRight)) {
    return normalizedLeft.toLowerCase() === normalizedRight.toLowerCase();
  }

  return normalizedLeft === normalizedRight;
};

const getAdminTargetNetworkId = (admin: AdminManagementAdmin) =>
  admin.networkIds[0] ?? null;

const AdminNetworksCell: React.FC<{
  networkIds: AdminManagementAdmin["networkIds"];
}> = ({ networkIds }) => {
  if (!networkIds.length) {
    return <span className="text-xs text-secondary-text">-</span>;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {networkIds.map((networkId) => (
        <NetworkDisplay key={networkId} networkId={networkId} />
      ))}
    </div>
  );
};

const ActionIconButton: React.FC<{
  disabled?: boolean;
  destructive?: boolean;
  title?: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ disabled, destructive, title, onClick, children }) => (
  <button
    type="button"
    disabled={disabled}
    title={title}
    className={cn("text-secondary-text transition-colors", {
      "hover:text-foreground": !destructive,
      "hover:text-destructive": destructive,
      "cursor-not-allowed opacity-50 hover:text-secondary-text": disabled,
    })}
    onClick={onClick}
  >
    {children}
  </button>
);

const AdminManagementTable = () => {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const currentNetworkId = useSystemStore((state) => state.selectedNetworkId);
  const openSwitchNetworkModal = useSystemStore(
    (state) => state.openSwitchNetworkModal,
  );
  const { filter, setFilter } = useAdminManagementSearchFilterStore();
  const queryClient = useQueryClient();
  const { toggleAdminRole: toggleAdminRoleEvm } = useToggleAdminRoleEvmFn();
  const { toggleAdminRole: toggleAdminRoleSolana } =
    useToggleAdminRoleSolanaFn();
  const [editingAdmin, setEditingAdmin] = useState<{
    admin: AdminManagementAdmin;
    isSelfAdmin: boolean;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminManagementAdmin | null>(
    null,
  );
  const [isDeletingOnChain, setIsDeletingOnChain] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: adminManagementQueryKeys.list(filter),
    enabled: hasHydrated && !!accessToken,
    queryFn: () =>
      adminManagementService.getListAdmins({
        page: filter.page,
        limit: PAGE_SIZE,
        search: filter.text || undefined,
        roles: filter.roles,
        networkIds: filter.network,
      }),
  });

  const refetchAdminManagementList = async () => {
    await queryClient.invalidateQueries({
      queryKey: adminManagementQueryKeys.all,
      exact: false,
    });
  };

  const { mutateAsync: deleteAdmin, isPending: isDeletePending } = useMutation({
    mutationFn: adminManagementService.deleteAdmin,
    onSuccess: async () => {
      toast.success("Admin deleted successfully!");
      await refetchAdminManagementList();
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage({ error }));
    },
  });

  const isSelfAdminRecord = (admin: AdminManagementAdmin) => {
    return Boolean(
      user?.address &&
        areWalletAddressesEqual(user.address, admin.walletAddress) &&
        admin.walletAddress,
    );
  };

  const validateAdminAction = (admin: AdminManagementAdmin): NetworkId | null => {
    if (isSelfAdminRecord(admin)) {
      toast.error(SELF_ADMIN_ACTION_ERROR);
      return null;
    }

    const targetNetworkId = getAdminTargetNetworkId(admin);

    if (!targetNetworkId) {
      toast.error(ADMIN_NETWORK_ERROR);
      return null;
    }

    return targetNetworkId;
  };

  const toggleAdminRoleOnChain = async ({
    walletAddress,
    role,
    enabled,
    networkId,
  }: {
    walletAddress: string;
    role: AdminManagementAdmin["role"];
    enabled: boolean;
    networkId: NetworkId;
  }) =>
    networkId === "solanaDevnet"
      ? toggleAdminRoleSolana({ walletAddress, enabled, role })
      : toggleAdminRoleEvm({ walletAddress, enabled, role });

  const handleToggleAdminStatus = async (admin: AdminManagementAdmin) => {
    const targetNetworkId = validateAdminAction(admin);

    if (!targetNetworkId) {
      return;
    }

    if (currentNetworkId !== targetNetworkId) {
      openSwitchNetworkModal(currentNetworkId, targetNetworkId);
      return;
    }

    setStatusUpdatingId(admin.id);
    try {
      const nextEnabled = !admin.enabled;
      const isUpdated = await toggleAdminRoleOnChain({
        walletAddress: admin.walletAddress,
        role: admin.role,
        enabled: nextEnabled,
        networkId: targetNetworkId,
      });

      if (isUpdated) {
        await adminManagementService.updateAdmin({
          id: admin.id,
          name: admin.name,
          email: admin.email,
          walletAddress: admin.walletAddress,
          role: admin.role,
          networkId: targetNetworkId,
          enabled: nextEnabled,
        });
        await refetchAdminManagementList();
      }
    } catch (error) {
      toast.error(getErrorMessage({ error }));
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) {
      return;
    }

    const targetNetworkId = validateAdminAction(deleteTarget);

    if (!targetNetworkId) {
      return;
    }

    if (currentNetworkId !== targetNetworkId) {
      openSwitchNetworkModal(currentNetworkId, targetNetworkId);
      return;
    }

    setIsDeletingOnChain(true);
    try {
      const isUpdated = await toggleAdminRoleOnChain({
        walletAddress: deleteTarget.walletAddress,
        role: deleteTarget.role,
        enabled: false,
        networkId: targetNetworkId,
      });

      if (!isUpdated) {
        return;
      }

      await deleteAdmin({
        walletAddress: deleteTarget.walletAddress,
        networkId: targetNetworkId,
      });
    } finally {
      setIsDeletingOnChain(false);
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
              <TableHead>Network</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Added</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSpinner isLoading={isPending} colSpan={7} />
            <TableNoData
              colSpan={7}
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
              const isSelfAdmin = isSelfAdminRecord(admin);
              const disabledActionTitle = isSelfAdmin
                ? SELF_ADMIN_ACTION_ERROR
                : undefined;

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
                    <AdminNetworksCell networkIds={admin.networkIds} />
                  </TableCell>

                  <TableCell>
                    <span
                      className={cn("text-sm font-semibold", {
                        "text-active": admin.role === "super_admin",
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
                      {admin.createdAt
                        ? new Date(admin.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )
                        : "N/A"}
                    </p>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-center gap-4.5">
                      <ActionIconButton
                        onClick={() =>
                          setEditingAdmin({
                            admin,
                            isSelfAdmin,
                          })
                        }
                      >
                        <PencilIcon className="size-4" />
                      </ActionIconButton>
                      <BlueSwitch
                        active={admin.enabled}
                        isLoading={isStatusLoading}
                        disabled={isStatusLoading || isSelfAdmin}
                        onClick={() => handleToggleAdminStatus(admin)}
                      />
                      <ActionIconButton
                        disabled={isSelfAdmin}
                        destructive
                        title={disabledActionTitle}
                        onClick={() => setDeleteTarget(admin)}
                      >
                        <Trash2Icon className="size-4" />
                      </ActionIconButton>
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
          admin={editingAdmin.admin}
          isSelfAdmin={editingAdmin.isSelfAdmin}
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
        description="This will revoke the admin role onchain first, then remove the admin from the management list."
        buttonConfirmText="Delete"
        isLoading={isDeletingOnChain || isDeletePending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default AdminManagementTable;
