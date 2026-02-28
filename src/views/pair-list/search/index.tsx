import MultipleSelect, {
  type MultipleSelectOption,
} from "@/components/common/multiple-select";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import NetworkIcon from "@/components/layout/header/network-icon";
import { NETWORK_CONFIGS } from "@/config/networks";

const PairListSearch = () => {
  const networkOptions: MultipleSelectOption[] = NETWORK_CONFIGS.map(
    (network) => ({
      label: network.label,
      value: network.id,
      icon: (className?: string) => (
        <NetworkIcon networkId={network.id} className={className} />
      ),
    }),
  );

  return (
    <div className="flex items-center justify-end gap-2.5">
      <SearchTextDebouncedInput
        inputProps={{
          placeholder: "Search pair...",
        }}
      />
      <MultipleSelect 
        options={networkOptions}
      />
    </div>
  );
};

export default PairListSearch;
