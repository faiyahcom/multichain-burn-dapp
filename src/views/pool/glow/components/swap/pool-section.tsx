import SwapPoolList from "./list";
import SwapSearch from "./search";

const SwapPoolSection = () => {
  return (
    <div className="space-y-3.75">
      <h2 className="text-28px font-semibold">SWAP POOLS</h2>
      <SwapSearch />
      <SwapPoolList />
    </div>
  );
};

export default SwapPoolSection;
