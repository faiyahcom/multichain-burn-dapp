import { ArrowIcon } from "@/components/common/arrow-icon";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

const BurnPoolListHeader = () => {
  return (
    <div className="mb-12.75 flex w-full items-center justify-between gap-10 pt-12.75 pr-13.5 pl-20.25">
      <h1 className="text-3xl font-semibold">Burn Pools List</h1>

      <Button
        variant={"mb-primary"}
        size={"mb-square-btn"}
        asChild
        className="gap-9.75 pr-10.5 pl-10.75"
      >
        <Link to="/burn/create">
          <span>Create Burn Pool</span>
          <ArrowIcon direction="right" />
        </Link>
      </Button>
    </div>
  );
};

export default BurnPoolListHeader;
