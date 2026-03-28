import BurnSearch from "./search";
import BurnPoolList from "./list";

const BurnPoolSection = () => {
  return (
    <div className="space-y-3.75">
      <h2 className="text-28px font-semibold">BURN POOLS</h2>
      <BurnSearch />
      <BurnPoolList />
    </div>
  );
};

export default BurnPoolSection;
