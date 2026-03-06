import PairDetailDetailHeader from "./header";
import PairDetailDetailList from "./list";
import PairDetailDetailSearch from "./search";

const PairDetailDetail = () => {
  return (
    <div className="flex-1 space-y-7">
      <PairDetailDetailHeader />
      <PairDetailDetailSearch />
      <PairDetailDetailList />
    </div>
  );
};

export default PairDetailDetail;
