import StakePoolList from "./list";
import StakeSearch from "./search";

const StakePoolSection = () => {
  return (
    <div className="space-y-3.75">
      <h2 className="text-28px font-semibold">STAKE POOLS</h2>
      <StakeSearch />
      <StakePoolList />
    </div>
  );
};

export default StakePoolSection;
