import { Spinner } from "@/components/ui/spinner";
import type { PoolItemType } from "@/types/admin/master-pool-management";
import PairDetailDetailListCardItem from "./item";
import NoData from "@/components/common/no-data";

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
      {isLoading && (
        <div className="flex items-center justify-center py-1">
          <Spinner />
        </div>
      )}
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
