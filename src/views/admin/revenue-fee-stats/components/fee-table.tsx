import CopyableText from "@/components/common/copyable-text";
import NetworkDisplay from "@/components/common/network-display";
import CustomPagination from "@/components/common/pagination";
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
import { IconGoTo } from "@/assets/react";
import { getExplorerTxUrl } from "@/utils/helpers/networks";
import { truncateString } from "@/utils/helpers/string";

export interface FeeRow {
    time: string;
    poolName: string;
    poolAddress: string;
    userName: string;
    userAddress: string;
    chainId: string;
    txHash: string;
    feeAmount: string;
}

const TABLE_COLUMNS = ["Time", "Pool name", "User", "Network", "Txhash", "Fee amount"];

export const LIMIT = 10;

export interface FeeTableProps {
    rows: FeeRow[];
    isLoading: boolean;
    page: number;
    totalCount: number;
    onPageChange: (page: number) => void;
}

const FeeTable = ({ rows, isLoading, page, totalCount, onPageChange }: FeeTableProps) => (
    <div className="space-y-4">
        <Table className="mb-2 border-spacing-y-0 rounded-b-lg border border-progress-bg">
            <TableHeader>
                <TableRow>
                    {TABLE_COLUMNS.map((col) => (
                        <TableHead
                            key={col}
                            className="h-auto border-b border-progress-bg py-3 text-base font-medium"
                        >
                            {col}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody className="[&>tr:not(:last-child)>td]:border-b [&>tr:not(:last-child)>td]:border-progress-bg">
                <TableSpinner isLoading={isLoading} colSpan={TABLE_COLUMNS.length} />
                <TableNoData data={rows} isLoading={isLoading} colSpan={TABLE_COLUMNS.length} />
                {rows.map((row, idx) => (
                    <TableRow key={idx} className="text-base text-greyed">
                        <TableCell>{row.time}</TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-medium">{row.poolName}</span>
                                <CopyableText
                                    content={row.poolAddress}
                                    displayText={truncateString({ str: row.poolAddress })}
                                    classNames={{ displayText: "text-xs text-secondary-text" }}
                                />
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-medium">{row.userName}</span>
                                <CopyableText
                                    content={row.userAddress}
                                    displayText={truncateString({ str: row.userAddress })}
                                    classNames={{ displayText: "text-xs text-secondary-text" }}
                                />
                            </div>
                        </TableCell>
                        <TableCell>
                            <NetworkDisplay chainId={row.chainId} />
                        </TableCell>
                        <TableCell>
                            <a
                                href={getExplorerTxUrl(row.chainId, row.txHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-baseline gap-1.5 text-greyed transition-colors hover:text-foreground"
                            >
                                {truncateString({ str: row.txHash })}
                                <IconGoTo className="shrink-0" />
                            </a>
                        </TableCell>
                        <TableCell>{row.feeAmount}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
        {totalCount > LIMIT && (
            <CustomPagination
                currentPage={page}
                totalCount={totalCount}
                pageSize={LIMIT}
                onPageChange={onPageChange}
            />
        )}
    </div>
);

export default FeeTable;
