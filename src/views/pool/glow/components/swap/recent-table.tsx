import { Button } from "@/components/common/glow/button";
import CopyableText from "@/components/common/copyable-text";
import NetworkDisplay from "@/components/common/network-display";
import RatioDisplay from "@/components/common/ratio-display";
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
import { chainIdToNetworkConfig } from "@/config/networks";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { PoolKindCodeEnum } from "@/types/pool";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { sciToFormatted } from "@/utils/helpers/numbers";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { truncateString } from "@/utils/helpers/string";
import { IconSwapCategory } from "@/assets/react";

const SwapRecentPoolsTable = ({ }: {}) => {
	const { data: recentPools, isPending: isRecentPoolsPending } = useQuery({
		queryKey: poolQueryKeys.recents(PoolKindCodeEnum.Swap),
		queryFn: () => poolService.getRecentPools(PoolKindCodeEnum.Swap),
	});

	const columns = ["Pool", "Pair", "Ratio", "Liquidity", "Network", "Action"];

	return (
		<div className="space-y-6">
			<Table>
				<TableHeader>
					<TableRow>
						{columns.map((column, index) => (
							<TableHead
								key={column}
								variant="swap"
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
						const tokenInDisplay = resolvePoolTokenDisplay({
							network,
							tokenAddress: pool.tokenIn,
							tokenSymbol: pool.tokenInSymbol,
							tokenName: pool.tokenInSymbol,
							customName: pool.tokenInSymbolCustom ?? undefined,
							customSymbol: pool.tokenInSymbolCustom ?? undefined,
							imageUri: pool.tokenInImageUri ?? undefined,
						});
						const tokenOutDisplay = resolvePoolTokenDisplay({
							network,
							tokenAddress: pool.tokenOut,
							tokenSymbol: pool.tokenOutSymbol,
							tokenName: pool.tokenOutSymbol,
							customName: pool.tokenOutSymbolCustom ?? undefined,
							customSymbol: pool.tokenOutSymbolCustom ?? undefined,
							imageUri: pool.tokenOutImageUri ?? undefined,
						});

						const isLive = pool.status === "on_going";
						const liquidityLabel = `${sciToFormatted(pool.tvl ?? 0, pool.tokenOutDecimals)} ${tokenOutDisplay.symbol}`;

						return (
							<TableRow key={pool.address}>
								<TableCell className="text-left">
									<div className="flex min-w-0 items-center gap-3">
										<IconSwapCategory className="size-10.75" />
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
									<div className="flex items-center justify-center gap-2 text-xl sm:text-24px">
										<span>{tokenOutDisplay.symbol}</span>
										<span>/</span>
										<span>{tokenInDisplay.symbol}</span>
									</div>
								</TableCell>
								<TableCell>
									<RatioDisplay
										inValue={pool.rewardDenominator}
										outValue={pool.rewardNumerator}
										inSymbol={tokenInDisplay.symbol}
										outSymbol={tokenOutDisplay.symbol}
										classNames={{
											container: "mx-auto w-max text-xl sm:text-24px",
										}}
									/>
								</TableCell>
								<TableCell>
									<span className="sm:text-24px text-xl">{liquidityLabel}</span>
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
									<Link to={`/swap/detail/${pool.address}`}>
										<Button
											variant={isLive ? "swap" : "swap-active"}
											className="sm:text-24px min-w-28 rounded-13px px-6 py-2 text-xl font-semibold sm:min-w-35"
										>
											Swap
										</Button>
									</Link>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
			<div className="flex justify-end">
				<Link to="/swap/" className="sm:text-24px text-xl font-semibold">
					See more
				</Link>
			</div>
		</div>
	);
};

export default SwapRecentPoolsTable;
