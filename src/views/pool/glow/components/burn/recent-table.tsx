import { Button } from "@/components/common/glow/button";
import CopyableText from "@/components/common/copyable-text";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/common/glow/table";
import TableNoData from "@/components/common/glow/table-no-data";
import TableSkeleton from "@/components/common/glow/table-skeleton";
import { getPoolStatusLabel } from "@/types/admin/master-pool-management";
import { Link, useNavigate } from "@tanstack/react-router";
import NetworkDisplay from "@/components/common/network-display";
import TokenImage from "@/components/common/token-image";
import { chainIdToNetworkConfig } from "@/config/networks";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { truncateString } from "@/utils/helpers/string";
import StartEndDateDisplay from "@/components/common/start-end-date-display";
import { PoolKindCodeEnum } from "@/types/pool";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useQuery } from "@tanstack/react-query";
import { IconBurnCategory } from "@/assets/react";

const BurnRecentPoolsTable = ({ }: {}) => {
    const navigate = useNavigate();
    const { data: recentPools, isPending: isRecentPoolsPending } = useQuery({
        queryKey: poolQueryKeys.recents(PoolKindCodeEnum.Burn),
        queryFn: () => poolService.getRecentPools(PoolKindCodeEnum.Burn),
    });

    const columns = [
        "Pool",
        "Time",
        "Burn",
        "Reward",
        "Network",
        "Ratio",
        "Status",
    ];

    return (
        <div className="space-y-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((column, index) => (
                            <TableHead
                                key={column}
                                variant="burn"
                                className="h-12 pt-2 align-baseline"
                                style={{
                                    width: index === 0 ? "280px" : `${100 / columns.length}%`,
                                }}
                            >
                                {column}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableSkeleton
                        colCount={columns.length}
                        rowCount={2}
                        isLoading={isRecentPoolsPending}
                    />
                    <TableNoData
                        colSpan={columns.length}
                        data={recentPools?.pools}
                        isLoading={isRecentPoolsPending}
                    />
                    {recentPools?.pools?.map((pool) => {
                        const network = chainIdToNetworkConfig(pool.chainId);
                        const burnTokenDisplay = resolvePoolTokenDisplay({
                            network,
                            tokenAddress: pool.tokenIn,
                            tokenSymbol: pool.tokenInSymbol,
                            tokenName: pool.tokenInSymbol,
                            customName: pool.tokenInSymbolCustom ?? undefined,
                            customSymbol: pool.tokenInSymbolCustom ?? undefined,
                            imageUri: pool.tokenInImageUri ?? undefined,
                        });
                        const rewardTokenDisplay = resolvePoolTokenDisplay({
                            network,
                            tokenAddress: pool.tokenOut,
                            tokenSymbol: pool.tokenOutSymbol,
                            tokenName: pool.tokenOutSymbol,
                            customName: pool.tokenOutSymbolCustom ?? undefined,
                            customSymbol: pool.tokenOutSymbolCustom ?? undefined,
                            imageUri: pool.tokenOutImageUri ?? undefined,
                        });
                        const statusLabel = getPoolStatusLabel(pool.status);
                        const isLive = pool.status === "on_going";
                        const href = `/burn/detail/${pool.address}`;

                        return (
                            <TableRow
                                key={pool.address}
                                variant="burn"
                                className="sm:text-24px cursor-pointer text-xl"
                                onClick={() => navigate({ to: href })}
                            >
                                <TableCell className="text-left">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <IconBurnCategory className="size-10.75" />
                                        <div className="min-w-0">
                                            <p
                                                className="sm:text-24px truncate text-xl font-semibold"
                                                title={pool.name}
                                            >
                                                {pool.name}
                                            </p>
                                            <CopyableText
                                                content={pool.address}
                                                displayText={truncateString({ str: pool.address })}
                                                classNames={{
                                                    container: "justify-start",
                                                    displayText: "text-mb-gray-b8 text-base sm:text-xl",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <StartEndDateDisplay
                                        startDate={pool.timeStart}
                                        endDate={pool.timeEnd}
                                        classNames={{
                                            container: "mx-auto w-max text-xl sm:text-24px",
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-center gap-3">
                                        <TokenImage
                                            src={burnTokenDisplay.imageUri}
                                            alt={burnTokenDisplay.symbol}
                                            classNames={{ common: "size-10 sm:size-12" }}
                                        />
                                        <span className="sm:text-24px text-xl">
                                            {burnTokenDisplay.symbol}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-center gap-3">
                                        <TokenImage
                                            src={rewardTokenDisplay.imageUri}
                                            alt={rewardTokenDisplay.symbol}
                                            classNames={{ common: "size-10 sm:size-12" }}
                                        />
                                        <span className="sm:text-24px text-xl">
                                            {rewardTokenDisplay.symbol}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <NetworkDisplay
                                        chainId={pool.chainId}
                                        classNames={{
                                            container: "flex items-center justify-center gap-3",
                                            img: "mr-0 size-10 sm:size-12",
                                            label: "text-xl sm:text-24px",
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <span className="sm:text-24px text-xl">Dynamic</span>
                                </TableCell>
                                <TableCell className="max-w-max w-max min-w-max">
                                    <Button
                                        variant={isLive ? "burn" : "burn-active"}
                                        hasGroupHover
                                        className="sm:text-24px min-w-28 rounded-13px px-6 py-2 font-orbitron text-xl font-semibold sm:min-w-46.5"
                                    >
                                        {statusLabel}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
            <div className="flex justify-end">
                <Link to="/burn/" className="sm:text-24px text-xl font-semibold pr-3">
                    See more
                </Link>
            </div>
        </div>
    );
};

export default BurnRecentPoolsTable;
