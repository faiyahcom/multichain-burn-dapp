import { IconTrashCan } from "@/assets/react";
import NetworkDisplay from "@/components/common/network-display";
import TokenImage from "@/components/common/token-image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PencilIcon } from "lucide-react";

const AdminMinRatioList = () => {
  const limit = 20;

  const columns = ["Pair", "Network", "Ratio", "Actions"];

  return (
    <div className="space-y-10 pb-10 md:pl-14">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className="whitespace-pre-line">
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* <TableSpinner isLoading={isPendingPools} colSpan={columns.length} />
          <TableNoData
            colSpan={columns.length}
            data={pools?.pools}
            isLoading={isPendingPools}
          /> */}
          {/* TODO: implement list and remove demo data */}
          {Array.from({ length: limit }).map((_, index) => (
            <TableRow key={index}>
              <TableCell className="w-75 xl:w-100">
                <div className="flex min-w-0 items-center gap-3.25 pl-15.75">
                  <div className="flex shrink-0 items-center gap-px">
                    <TokenImage
                      //   src={tokenOutDisplay.imageUri}
                      //   alt={tokenOutDisplay.symbol}
                      classNames={{
                        common: "size-6.25",
                      }}
                    />
                    <TokenImage
                      //   src={tokenInDisplay.imageUri}
                      //   alt={tokenInDisplay.symbol}
                      classNames={{
                        common: "size-6.25",
                      }}
                    />
                  </div>
                  <span className="min-w-0 truncate">BTC/USDT</span>
                </div>
              </TableCell>
              <TableCell>
                <NetworkDisplay networkId="xphere" />
              </TableCell>
              <TableCell>
                <span>0.25</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-4.5">
                  <button>
                    <PencilIcon className="size-4" />
                  </button>
                  <button>
                    <IconTrashCan className="[&>path]:group-hover:stroke-[1.5px]" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminMinRatioList;
