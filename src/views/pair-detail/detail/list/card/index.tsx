import CenterSpinner from "@/components/common/center-spinner";
import NoData from "@/components/common/no-data";
import type { PoolItemType } from "@/types/admin/master-pool-management";
import PairDetailDetailListCardItem from "./item";

interface Props {
  data?: PoolItemType[];
  isLoading?: boolean;
}

const PairDetailDetailListCardLayout: React.FC<Props> = ({
  data,
  isLoading,
}) => {
  return (
    <>
      <CenterSpinner isLoading={isLoading} />
      <div className="grid grid-cols-1 gap-x-4.5 gap-y-5.25 md:grid-cols-2 2xl:grid-cols-3">
        <NoData
          isLoading={isLoading}
          data={data}
          classNames={{
            container: "col-span-1 md:col-span-2 2xl:col-span-3",
          }}
        />
        {data?.map((item, index) => {
          return <PairDetailDetailListCardItem data={item} key={index} />;
        })}
      </div>
    </>
  );
};

export default PairDetailDetailListCardLayout;
