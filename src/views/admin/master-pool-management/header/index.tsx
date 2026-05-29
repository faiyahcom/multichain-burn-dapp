import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authService, isSuperAdminRole } from "@/services/authService";
import { authQueryKeys } from "@/services/queries/queryKey";
import { useAuthStore } from "@/stores/authStore";
import type { PoolType } from "@/types/admin/master-pool-management";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";

interface Props {
  poolType: PoolType;
}

const AdminMasterPoolManagementHeader: React.FC<Props> = ({ poolType }) => {
  const isStakePool = poolType === 2;
  const isLaunchpad = poolType === 3;
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: userApiData } = useQuery({
    queryKey: authQueryKeys.me({
      address: user?.address,
    }),
    queryFn: async () => {
      return authService.getCurrentUser();
    },
    enabled: !!user?.address,
  });
  const isSuperAdmin = isSuperAdminRole(userApiData);

  return (
    <div
      className={cn(
        "px-4 pt-5 pb-5 md:pt-11 md:pr-13 md:pl-14",
        "flex flex-col justify-between gap-2 md:flex-row",
      )}
    >
      <div>
        <h1 className="text-3xl font-semibold">Master Pool Management</h1>
        <p className="text-base text-mb-gray-69">
          Manage all swap, burn, staking pools and launchpads
        </p>
      </div>
      {/* Only super admin can create pool */}
      {user && isSuperAdmin && isStakePool && (
        <Button
          variant={"mb-primary"}
          size={"mb-square-btn"}
          onClick={() => {
            navigate({
              to: "/admin/stake/create",
            });
          }}
        >
          <span className="">Create Staking Pool</span>{" "}
          <PlusIcon className="size-3.75" />
        </Button>
      )}
      {user && isSuperAdmin && isLaunchpad && (
        <Button
          variant={"mb-primary"}
          size={"mb-square-btn"}
          onClick={() => {
            navigate({
              to: "/admin/launchpad/create",
            });
          }}
        >
          <span className="">Create Launchpad</span>{" "}
          <PlusIcon className="size-3.75" />
        </Button>
      )}
    </div>
  );
};

export default AdminMasterPoolManagementHeader;
