import CopyableText from "@/components/common/copyable-text";
import NetworkDisplay from "@/components/common/network-display";
import TableNoData from "@/components/common/table-no-data";
import TableSpinner from "@/components/common/table-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserType } from "@/services/adminUserManagementService";
import { truncateString } from "@/utils/helpers/string";
import { format, parseISO } from "date-fns";

interface Props {
  data?: UserType[];
  isLoading?: boolean;
}

const AdminUserManagementList: React.FC<Props> = ({ data, isLoading }) => {
  const columns = ["Nickname", "Wallet Address", "Network", "Joined Date"];

  return (
    <Table className="border-spacing-y-0 text-mb-black-18b">
      <TableHeader>
        <TableRow>
          {columns.map((column, index) => (
            <TableHead
              className="h-auto border-b border-progress-bg px-3 py-2 text-left sm:px-6 sm:py-4"
              key={index}
            >
              {column}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody className="[&>tr:not(:last-child)>td]:border-b [&>tr:not(:last-child)>td]:border-progress-bg">
        <TableSpinner isLoading={isLoading} colSpan={columns.length} />
        <TableNoData
          colSpan={columns.length}
          data={data}
          isLoading={isLoading}
        />
        {data?.map((item, index) => {
          let formattedDate = "-";
          try {
            formattedDate = format(parseISO(item.joinedDate), "yyyy/MM/dd");
          } catch (error) {
            console.log(error);
          }

          return (
            <TableRow key={index} className="text-mb-gray-71a">
              <TableCell className="px-3 text-left sm:px-6">
                <p
                  className="min-w-0 truncate text-mb-black-18b"
                  title={item.name}
                >
                  {item.name}
                </p>
              </TableCell>
              <TableCell className="px-3 text-left sm:px-6">
                <CopyableText
                  content={item.address}
                  displayText={truncateString({ str: item.address })}
                  classNames={{
                    container: "justify-start",
                  }}
                />
              </TableCell>
              <TableCell className="px-3 text-left sm:px-6">
                <NetworkDisplay
                  chainId={item.chainId}
                  classNames={{
                    label: "text-foreground",
                  }}
                />
              </TableCell>
              <TableCell className="px-3 text-left sm:px-6">
                <p className="min-w-0 truncate" title={formattedDate}>
                  {formattedDate}
                </p>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default AdminUserManagementList;
