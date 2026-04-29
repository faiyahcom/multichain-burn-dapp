import { FContainer, FSummarySection } from "@/components/common/fcontainer";
import CustomPagination from "@/components/common/pagination";
import { networkIdToChainId } from "@/config/networks";
import { adminUserManagementService } from "@/services/adminUserManagementService";
import { adminUserManagementQueryKeys } from "@/services/queries/queryKey";
import { useAdminUserManagementSearchFilterStore } from "@/stores/admin/user-management/search-filter-store";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import AdminUserManagementList from "@/views/admin/user-management/list";
import AdminUserManagementSearch from "@/views/admin/user-management/search";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { endOfDay, startOfDay } from "date-fns";

export const Route = createFileRoute("/admin/user-management/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { filter, setFilter } = useAdminUserManagementSearchFilterStore();
  const { data: usersData, isPending: isUsersPending } = useQuery({
    queryKey: adminUserManagementQueryKeys.list(filter),
    queryFn: async () => {
      return adminUserManagementService.getList({
        page: filter.page,
        limit: filter.limit,
        search: filter.text || undefined,
        chainIds: convertArrayToStringParam({
          array: filter.network?.map((network) => networkIdToChainId(network)),
        }),
        joinedFrom: filter.dateRange?.from
          ? Math.floor(startOfDay(filter.dateRange.from).getTime() / 1000)
          : undefined,
        joinedTo: filter.dateRange?.to
          ? Math.floor(endOfDay(filter.dateRange.to).getTime() / 1000)
          : undefined,
      });
    },
  });

  return (
    <div className="flex flex-col justify-between gap-2.5 pb-10 sm:gap-5">
      <div className="space-y-2.5 sm:space-y-10">
        <div className="px-7 pt-5 sm:px-14 sm:pt-11">
          <h1 className="text-3xl font-semibold">User Management</h1>
          <p className="text-base text-mb-gray-69">
            View and manage all registered users.
          </p>
        </div>

        <FContainer className="mx-4 pt-1 sm:mr-13.5 sm:ml-9.75 sm:pt-2">
          <AdminUserManagementSearch />
          <AdminUserManagementList
            data={usersData?.users}
            isLoading={isUsersPending}
          />
          <FSummarySection
            currentNumber={Math.min(filter.limit, usersData?.total || 0)}
            totalNumber={usersData?.total}
            unit="user"
          />
        </FContainer>
      </div>

      <CustomPagination
        currentPage={filter.page}
        totalCount={usersData?.total || 0}
        pageSize={filter.limit}
        onPageChange={(page) => setFilter({ page })}
      />
    </div>
  );
}
