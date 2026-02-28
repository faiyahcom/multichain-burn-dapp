import { usePairListSearchFilterStore } from "@/stores/pair-list/search-filter-store";
import PairListListListLayout from "./list";
import PairListListCardLayout from "./card";

const PairListList = () => {
  const { filter } = usePairListSearchFilterStore();

  return (
    <>
      {filter.listLayout === "list" && <PairListListListLayout />}
      {filter.listLayout === "card" && <PairListListCardLayout />}
    </>
  );
};

export default PairListList;
