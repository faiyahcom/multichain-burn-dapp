import { TableCell, TableRow } from "../ui/table";
import NoData from "./no-data";

interface Props {
  colSpan?: number;
  text?: string;
  data?: unknown[];
  isLoading?: boolean;
}

const TableNoData: React.FC<Props> = ({
  colSpan,
  text = "No data found",
  data,
  isLoading,
}) => {
  if (isLoading) return null;
  if (!!data && data.length > 0) return null;

  return (
    <TableRow>
      <TableCell colSpan={colSpan}>
        <NoData text={text} data={data} isLoading={isLoading} />
      </TableCell>
    </TableRow>
  );
};

export default TableNoData;
