import GlowContainer from "@/components/common/glow/container";
import type { MultipleSelectOption } from "@/components/common/glow/multiple-select";
import MultipleSelect from "@/components/common/glow/multiple-select";
import SearchTextDebouncedInput from "@/components/common/glow/search-text-debounced-input";
import { useMyActivitySearchFilterStore } from "@/stores/my-activity/search-filter-store";
import {
  getMyActivityActionLabel,
  myActivityActions,
  type ActivityKeyList,
} from "@/types/pool";

const MyActivitySearch = () => {
  const { filter, setFilter } = useMyActivitySearchFilterStore();

  const activityKindOptions: MultipleSelectOption[] = myActivityActions.map(
    (key) => ({
      label: getMyActivityActionLabel(key),
      value: key,
    }),
  );

  return (
    <>
      <GlowContainer
        variant="pair"
        className="flex flex-col gap-3 p-3 sm:gap-6 sm:p-6 lg:flex-row"
      >
        <SearchTextDebouncedInput
          inputProps={{
            placeholder: "Search",
          }}
          value={filter.text}
          onValueChange={(value) => setFilter({ text: value })}
          variant="pair"
        />
        <MultipleSelect
          variant="pair"
          options={activityKindOptions}
          selected={filter.activityKind?.map((kind) => kind.toString())}
          onChange={(value) =>
            setFilter({
              activityKind: value.map((v) => v as ActivityKeyList),
            })
          }
          placeholder="Action"
          classNames={{
            btn: "xl:max-w-80",
          }}
        />
      </GlowContainer>
    </>
  );
};

export default MyActivitySearch;
