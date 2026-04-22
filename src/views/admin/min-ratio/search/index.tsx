import NetworkMultipleSelect from "@/components/common/network-multiple-select";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import { Button } from "@/components/ui/button";
import { useMinRatioSearchFilterStore } from "@/stores/admin/min-ratio/search-filter-store";
import { useNavigate } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";

const AdminMinRatioSearch = () => {
  const navigate = useNavigate();
  const { filter, setFilter } = useMinRatioSearchFilterStore();

  return (
    <div className="space-y-4 px-4 pt-4 md:pt-12.75 md:pr-13.5 md:pl-21">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Min Ratio</h1>
        </div>
        <Button
          variant={"mb-primary"}
          size={"mb-square-btn"}
          aria-label="Add new Min Ratio"
          onClick={() => {
            navigate({
              to: "/admin/min-ratio/create",
            });
          }}
        >
          <span className="max-md:sr-only">Add new Min Ratio</span>
          <PlusIcon className="size-3.75" />
        </Button>
      </div>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <SearchTextDebouncedInput
          inputProps={{
            placeholder: "Search Pairs...",
          }}
          value={filter.text}
          onValueChange={(value) => setFilter({ text: value })}
        />
        <div className="flex items-center gap-1">
          <SearchTextDebouncedInput
            inputProps={{
              placeholder: "Min",
              type: "number",
              min: 0,
              onKeyDown: (e) => {
                // Prevent minus sign from being entered
                if (e.key === "-") {
                  e.preventDefault();
                }
              },
              onPaste: (e) => {
                // Prevent minus sign from being entered
                const pasted = e.clipboardData?.getData("text");
                if (pasted?.includes("-")) {
                  e.preventDefault();
                }
              },
            }}
            value={filter.min}
            onValueChange={(value) => setFilter({ min: value })}
            className="lg:w-30 xl:w-50"
            addons={null}
          />
          <span>to</span>
          <SearchTextDebouncedInput
            inputProps={{
              placeholder: "Max",
              type: "number",
              min: 0,
              onKeyDown: (e) => {
                // Prevent minus sign from being entered
                if (e.key === "-") {
                  e.preventDefault();
                }
              },
              onPaste: (e) => {
                // Prevent minus sign from being entered
                const pasted = e.clipboardData?.getData("text");
                if (pasted?.includes("-")) {
                  e.preventDefault();
                }
              },
            }}
            value={filter.max}
            onValueChange={(value) => setFilter({ max: value })}
            className="lg:w-30 xl:w-50"
            addons={null}
          />
        </div>
        <NetworkMultipleSelect
          selected={filter.network}
          onChange={(value) => setFilter({ network: value })}
        />
      </div>
    </div>
  );
};

export default AdminMinRatioSearch;
