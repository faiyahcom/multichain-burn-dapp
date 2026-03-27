import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "./table";

interface Props {
  colCount: number;
  rowCount: number;
  isLoading?: boolean;
}

const TableSkeleton: React.FC<Props> = ({ colCount, rowCount, isLoading }) => {
  if (!isLoading) return null;

  return (
    <>
      {Array.from({ length: rowCount }, (_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: colCount }, (_, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton className="h-6 w-full sm:h-10.5" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};

export default TableSkeleton;
