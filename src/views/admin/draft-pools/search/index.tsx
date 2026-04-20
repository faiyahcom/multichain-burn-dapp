import NetworkMultipleSelect from "@/components/common/network-multiple-select";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import { Button } from "@/components/ui/button";
import { authService, isSuperAdminRole } from "@/services/authService";
import { authQueryKeys } from "@/services/queries/queryKey";
import { useDraftPoolsSearchFilterStore } from "@/stores/admin/draft-pools/search-filter-store";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";

const AdminDraftPoolsSearch = () => {
  const navigate = useNavigate();
  const { filter, setFilter } = useDraftPoolsSearchFilterStore();
  const { user } = useAuthStore();

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
    <div className="space-y-9.5 px-4 pt-4 md:pt-12.75 md:pr-12.75 md:pl-21">
      <div className="flex flex-col justify-between md:flex-row">
        <h1 className="text-3xl font-semibold">Draft Pools</h1>
        {/* Only super admin can create pool */}
        {user && isSuperAdmin && (
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
      </div>
      <div className="flex flex-col justify-between gap-2.5 md:flex-row md:items-center">
        {/* TODO: Only stake pool, for now */}
        {/* <SingleSelect
          options={poolTypeOptions}
          selected={filter.type}
          onChange={handleSelectType}
          classNames={{
            content: "w-55.5 capitalize",
            btn: "min-w-34",
          }}
        /> */}

        <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
          <NetworkMultipleSelect
            selected={filter.network}
            onChange={(value) => setFilter({ network: value })}
          />
          <SearchTextDebouncedInput
            inputProps={{
              placeholder: "Search Pools...",
            }}
            value={filter.text}
            onValueChange={(value) => setFilter({ text: value })}
            className="md:max-w-100"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDraftPoolsSearch;
