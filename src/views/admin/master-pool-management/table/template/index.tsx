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
import type { AdminPoolItemType } from "@/services/adminPoolManagementService";
import {
  getPoolStatusColor,
  getPoolStatusLabel,
  type PoolType,
} from "@/types/admin/master-pool-management";
import { useMemo } from "react";
import { useNavigate, type LinkOptions } from "@tanstack/react-router";
import CopyableText from "@/components/common/copyable-text";
import { truncateString } from "@/utils/helpers/string";
import StartEndDateDisplay from "@/components/common/start-end-date-display";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { chainIdToNetworkConfig } from "@/config/networks";
import TokenOutInInterceptDisplay from "@/components/common/token-out-in-intercept-display";
import NetworkDisplay from "@/components/common/network-display";
import ArrowSortButton from "@/components/common/arrow-sort-button";
import type { SortBy, SortOrder } from "@/types/common";
import MetricNumber from "@/components/common/metric-number";
import PartnerBurnSwitch from "../../partner-burn-switch";
import { useQueryClient } from "@tanstack/react-query";
import { adminPoolManagementQueryKeys } from "@/services/queries/queryKey";
import LowRewardNotiSwitch from "../../low-reward-noti-switch";
import AnimateIconButton from "@/components/common/animate-icon-button";

interface Props {
  poolType: PoolType;
  data?: AdminPoolItemType[];
  isLoading?: boolean;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  onToggleSort?: ({
    sortBy,
    sortOrder,
  }: {
    sortBy: SortBy;
    sortOrder: SortOrder;
  }) => void;
}

const AdminMasterPoolManagementTableTemplate: React.FC<Props> = ({
  poolType,
  data,
  isLoading,
  sortBy,
  sortOrder,
  onToggleSort,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const columns: (
    | string
    | {
        label: string;
        render?: React.ReactNode;
      }
  )[] = useMemo(() => {
    switch (poolType) {
      case 0:
        return [
          "Pool Name & \nAddress",
          "Time",
          "Pair",
          "Network",
          {
            label: "Joined Users",
            render: (
              <div className="mx-auto flex w-max items-center gap-2">
                <span>Joined Users</span>
                <ArrowSortButton
                  onToggleSort={onToggleSort}
                  sortBy="joinedUsersCount"
                  isActive={sortBy === "joinedUsersCount"}
                  sortOrder={sortOrder}
                />
              </div>
            ),
          },
          {
            label: "Burned \nAmount",
            render: (
              <div className="mx-auto flex w-max items-center gap-2">
                <span>{"Burned \nAmount"}</span>
                <ArrowSortButton
                  onToggleSort={onToggleSort}
                  sortBy="burnedAmount"
                  isActive={sortBy === "burnedAmount"}
                  sortOrder={sortOrder}
                />
              </div>
            ),
          },
          "Partner burn",
          "Status",
        ];
      case 1:
        return [
          "Pool Name & \nAddress",
          "Pair",
          "Network",
          {
            label: "Joined Users",
            render: (
              <div className="mx-auto flex w-max items-center gap-2">
                <span>Joined Users</span>
                <ArrowSortButton
                  onToggleSort={onToggleSort}
                  sortBy="joinedUsersCount"
                  isActive={sortBy === "joinedUsersCount"}
                  sortOrder={sortOrder}
                />
              </div>
            ),
          },
          {
            label: "Swapped Amount",
            render: (
              <div className="mx-auto flex w-max items-center gap-2">
                <span>Swapped Amount</span>
                <ArrowSortButton
                  onToggleSort={onToggleSort}
                  sortBy="swappedAmount"
                  isActive={sortBy === "swappedAmount"}
                  sortOrder={sortOrder}
                />
              </div>
            ),
          },
          "Status",
        ];

      case 2:
        return [
          "Pool Name & Address",
          "Time",
          "Pair",
          "Network",
          {
            label: "Joined Users",
            render: (
              <div className="mx-auto flex w-max items-center gap-2">
                <span>Joined Users</span>
                <ArrowSortButton
                  onToggleSort={onToggleSort}
                  sortBy="joinedUsersCount"
                  isActive={sortBy === "joinedUsersCount"}
                  sortOrder={sortOrder}
                />
              </div>
            ),
          },
          {
            label: "Staked \nAmount",
            render: (
              <div className="mx-auto flex w-max items-center gap-2">
                <span>{"Staked \nAmount"}</span>
                <ArrowSortButton
                  onToggleSort={onToggleSort}
                  sortBy="stakedAmount"
                  isActive={sortBy === "stakedAmount"}
                  sortOrder={sortOrder}
                />
              </div>
            ),
          },
          "Low Reward \nNotif.",
          "Status",
        ];

      case 3:
        return []; // TODO: launchpad

      default:
        void (poolType satisfies never); // exhaustive check
        return [];
    }
  }, [poolType, sortBy, sortOrder]);

  return (
    <Table className="border-y border-mb-gray-f45 md:pl-3.5">
      <TableHeader>
        <TableRow>
          {columns.map((column, index) => (
            <TableHead key={index} className="h-18 whitespace-pre-line">
              {typeof column === "string" ? column : column.render}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableSpinner isLoading={isLoading} colSpan={columns.length} />
        <TableNoData
          colSpan={columns.length}
          data={data}
          isLoading={isLoading}
        />

        {data?.map((item) => {
          const isBurnPool = item.kind === 0;
          const isStakePool = item.kind === 2;
          const networkConfig = chainIdToNetworkConfig(item.chainId);

          const tokenOutDisplay = resolvePoolTokenDisplay({
            tokenAddress: item.tokenOut,
            tokenName: item.tokenOutSymbol,
            tokenSymbol: item.tokenOutSymbol,
            imageUri: item.tokenOutImageUri ?? undefined,
            network: networkConfig,
            customName: item.tokenOutSymbolCustom ?? undefined,
            customSymbol: item.tokenOutSymbolCustom ?? undefined,
          });

          const tokenInDisplay = resolvePoolTokenDisplay({
            tokenAddress: item.tokenIn,
            tokenName: item.tokenInSymbol,
            tokenSymbol: item.tokenInSymbol,
            imageUri: item.tokenInImageUri ?? undefined,
            network: networkConfig,
            customName: item.tokenInSymbolCustom ?? undefined,
            customSymbol: item.tokenInSymbolCustom ?? undefined,
          });

          const href: LinkOptions["to"] = (() => {
            const poolType = item.kind;

            switch (poolType) {
              case 0:
                return "/admin/burn/detail/$address";

              case 1:
                return "/admin/swap/detail/$address";

              case 2:
                return "/admin/stake/detail/$address";

              case 3:
                return "/"; // TODO: launchpad

              default:
                void (poolType satisfies never); // exhaustive check
                return "/";
            }
          })();

          const amount: string = (() => {
            const poolType = item.kind;
            switch (poolType) {
              case 0:
                return item.burnedAmount ?? "0";

              case 1:
                return item.swappedAmount ?? "0";

              case 2:
                return item.stakedAmount ?? "0";

              case 3:
                return "0"; // TODO: launchpad

              default:
                void (poolType satisfies never); // exhaustive check
                return "0";
            }
          })();

          return (
            <TableRow
              key={item.address}
              className="cursor-pointer"
              onClick={() => {
                navigate({
                  to: href,
                  params: { address: item.address },
                });
              }}
            >
              {/* Pool Name & Address */}
              <TableCell className="pl-7 text-left">
                <p className="block max-w-70 truncate" title={item.name}>
                  {item.name}
                </p>
                <CopyableText
                  content={item.address}
                  displayText={truncateString({
                    str: item.address,
                  })}
                  classNames={{
                    container: "justify-start",
                  }}
                />
              </TableCell>
              {/* Time */}
              {(isBurnPool || isStakePool) && (
                <TableCell>
                  <StartEndDateDisplay
                    startDate={item.timeStart}
                    endDate={item.timeEnd}
                    classNames={{
                      container: "2xl:flex-row",
                      dash: "2xl:block",
                    }}
                  />
                </TableCell>
              )}
              {/* Pair */}
              <TableCell>
                <TokenOutInInterceptDisplay
                  tokenOutProps={{
                    src: tokenOutDisplay.imageUri,
                    alt: tokenOutDisplay.name,
                  }}
                  tokenInProps={{
                    src: tokenInDisplay.imageUri,
                    alt: tokenInDisplay.name,
                  }}
                  className="justify-center"
                />
              </TableCell>
              {/* Network */}
              <TableCell>
                <NetworkDisplay chainId={item.chainId} />
              </TableCell>
              {/* Joined Users */}
              <TableCell>
                <MetricNumber number={item.joinedUsersCount} isShorten />
              </TableCell>
              {/* Amount */}
              <TableCell>
                <MetricNumber
                  number={amount}
                  unit={tokenInDisplay.symbol}
                  isShorten
                />
              </TableCell>
              {/* Partner burn */}
              {isBurnPool && (
                <TableCell>
                  <PartnerBurnSwitch
                    address={item.address}
                    isPartner={!!item.isPartner}
                    onSuccess={() => {
                      queryClient.invalidateQueries({
                        queryKey: adminPoolManagementQueryKeys
                          .list()
                          .filter(Boolean),
                        exact: false,
                      });
                    }}
                    classNames={{ btn: "mx-auto" }}
                  />
                </TableCell>
              )}
              {/* Low reward noti */}
              {isStakePool && (
                <TableCell>
                  <LowRewardNotiSwitch
                    address={item.address}
                    chainId={item.chainId}
                    isLowRewardNotiEnabled={!!item.lowRewardNotiEnabled}
                    classNames={{
                      btn: "mx-auto",
                    }}
                  />
                </TableCell>
              )}
              {/* Status */}
              <TableCell>
                <AnimateIconButton
                  variant="letter-icon"
                  iconLetter={getPoolStatusLabel(item.status).slice(0, 1)}
                  textVariant="text-container-center"
                  hasGroupHover
                  color={getPoolStatusColor(item.status)}
                  text={getPoolStatusLabel(item.status)}
                  classNames={{
                    btn: "min-w-33 mx-auto",
                  }}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default AdminMasterPoolManagementTableTemplate;
