import { Spinner } from "../ui/spinner";
import { TableRow, TableCell } from "../ui/table";

interface Props {
  isLoading?: boolean;
  colSpan?: number;
}

const TableSpinner: React.FC<Props> = ({ isLoading, colSpan }) => {
  if (!isLoading) return null;

  return (
    <TableRow>
      <TableCell colSpan={colSpan}>
        <div className="flex items-center justify-center py-6">
          <Spinner />
        </div>
      </TableCell>
    </TableRow>
  );
};

export default TableSpinner;
