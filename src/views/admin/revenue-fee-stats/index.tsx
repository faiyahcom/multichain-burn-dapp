import DatePicker from "@/components/common/date-picker";
import NetworkImgIcon from "@/components/common/network-img-icon";
import type { SingleSelectOption } from "@/components/common/single-select";
import SingleSelect from "@/components/common/single-select";
import {
  chainIdToNetworkConfig,
  NETWORK_CONFIGS,
  networkIdToChainId,
  type nativeCurrency,
} from "@/config/networks";
import { useNativePrices } from "@/hooks/useNativePrices";
import { feeService, feeTxnKind } from "@/services/feeService";
import { feeQueryKeys } from "@/services/queries/queryKey";
import { formatNativeWithUsd } from "@/utils/helpers/numbers";
import { formatTimestampSecondsToDate } from "@/utils/helpers/string";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { endOfDay, startOfDay } from "date-fns";
import { useMemo, useState } from "react";
import FeeTable, { LIMIT, type FeeRow } from "./components/fee-table";
import StatBox from "./components/stat-box";
import StatBoxDialog, { type TabType } from "./components/stat-box-dialog";

// ── Main page ─────────────────────────────────────────────────────────────────

const AdminRevenueFeeStats = () => {
  const [activeTab, setActiveTab] = useState<TabType>("creation");
  const [networkId, setNetworkId] = useState<string>("ethereumTestnet");
  const [networkSelectOpen, setNetworkSelectOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [creationPage, setCreationPage] = useState(1);
  const [settlementPage, setSettlementPage] = useState(1);
  const [dialogType, setDialogType] = useState<TabType | null>(null);

  const currentPage = activeTab === "creation" ? creationPage : settlementPage;
  const chainId = networkIdToChainId(networkId) ?? "";
  const networkConfig = chainIdToNetworkConfig(chainId);

  const nativeDecimals =
    (networkConfig?.appKitNetwork.nativeCurrency as nativeCurrency | undefined)
      ?.decimals ?? 18;
  const nativeSymbol =
    (networkConfig?.appKitNetwork.nativeCurrency as nativeCurrency | undefined)
      ?.symbol ?? "";

  const fromParam = dateFrom
    ? String(Math.floor(startOfDay(dateFrom).getTime() / 1000))
    : undefined;

  const toParam = dateTo
    ? String(Math.floor(endOfDay(dateTo).getTime() / 1000))
    : undefined;
  const kindsParam =
    activeTab === "creation"
      ? [feeTxnKind.createBurnPool, feeTxnKind.createSwapPool].join(",")
      : [feeTxnKind.claimBurnReward, feeTxnKind.swap].join(",");

  const statsParams = { chainId, from: fromParam, to: toParam };
  const listParams = {
    page: currentPage,
    limit: LIMIT,
    chainId,
    from: fromParam,
    to: toParam,
    kinds: kindsParam,
  };

  const { data: nativePricesData } = useNativePrices();

  const nativePriceForChain = (cid: string): number | undefined =>
    nativePricesData?.natives.find((n) => n.chainId === cid)?.price;

  const { data: statsData } = useQuery({
    queryKey: feeQueryKeys.stats(statsParams as Record<string, unknown>),
    queryFn: () => feeService.getStats(statsParams),
  });

  const { data: listData, isPending: isLoadingList } = useQuery({
    queryKey: feeQueryKeys.list(listParams as Record<string, unknown>),
    queryFn: () => feeService.getList(listParams),
    enabled: !!chainId,
  });

  const feeRows: FeeRow[] = useMemo(
    () =>
      (listData?.txns ?? []).map((record) => ({
        time: formatTimestampSecondsToDate({
          timestamp: record.timestamp,
          formatStr: "dd/MM/yyyy",
        }),
        poolName: record.pool.name,
        poolAddress: record.poolAddress,
        userName: record.executor.name,
        userAddress: record.executorAddress,
        chainId: record.chainId,
        txHash: record.hash,
        feeAmount: formatNativeWithUsd(
          record.amount,
          record.tokenDecimals,
          record.tokenSymbol,
          nativePriceForChain(record.chainId),
        ),
      })),
    [listData],
  );

  const creationFeeDisplay = statsData?.create_fee
    ? formatNativeWithUsd(
        statsData.create_fee,
        nativeDecimals,
        nativeSymbol,
        nativePriceForChain(chainId),
      )
    : "—";
  const settlementFeesCount = statsData?.settlement_fees.length ?? 0;

  const networkOptions: SingleSelectOption[] = NETWORK_CONFIGS.map(
    (network) => ({
      label: network.label,
      value: network.id,
      triggerLabel: network.shortLabel,
      icon: ({ className }: { className?: string }) => (
        <NetworkImgIcon
          src={network.iconSrc}
          className={className}
          alt={network.label}
        />
      ),
    }),
  );

  return (
    <div className="relative flex w-full flex-col px-4 pb-10 md:px-13.5">
      {/* Title */}
      <h1 className="pt-4 pb-8 text-3xl font-semibold">
        Revenue &amp; Fee Statistics
      </h1>

      {/* Stats + Filters row */}
      <div className="mb-8 flex flex-col flex-wrap items-start justify-between gap-4 md:flex-row">
        {/* Stat boxes */}
        <div className="flex flex-wrap gap-4">
          <StatBox
            label="Creation Fee"
            value={creationFeeDisplay}
            valueClassName="text-[#7CB1FF]"
            // onClick={() => setDialogType("creation")}
            icon={
              <span className="flex size-7 items-center justify-center rounded-full bg-[#7CB1FF] text-sm font-bold text-primary-foreground">
                C
              </span>
            }
          />
          <StatBox
            label="Settlement Fee"
            value={`${settlementFeesCount}`}
            valueClassName="text-[#FFD65D]"
            onClick={() => setDialogType("settlement")}
            icon={
              <span className="flex size-7 items-center justify-center rounded-full bg-[#FFD65D] text-md font-bold text-primary-foreground">
                S
              </span>
            }
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col items-end gap-2.75 max-md:w-full">
          <SingleSelect
            options={networkOptions}
            selected={networkId}
            open={networkSelectOpen}
            onOpenChange={setNetworkSelectOpen}
            onChange={(value) => {
              setNetworkId(value);
              setNetworkSelectOpen(false);
            }}
            placeholder="Network"
            classNames={{
              btn: "max-md:w-full",
            }}
          />
          <div className="flex flex-col gap-2.75 max-md:w-full md:flex-row md:items-center">
            <p className="text-13px">Date</p>
            <DatePicker
              value={dateFrom}
              onChange={setDateFrom}
              placeholder="DD/MM/YY"
              calendarProps={{
                disabled: dateTo ? { after: dateTo } : undefined,
              }}
            />
            <p className="text-13px">to</p>
            <DatePicker
              value={dateTo}
              onChange={setDateTo}
              placeholder="DD/MM/YY"
              calendarProps={{
                disabled: dateFrom ? { before: dateFrom } : undefined,
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-end gap-10">
        <button
          onClick={() => setActiveTab("creation")}
          className="relative pb-1 text-lg font-medium transition-colors"
        >
          <span
            className={clsx(
              "transition-colors",
              activeTab === "creation"
                ? "text-foreground"
                : "text-greyed/50 hover:text-greyed",
            )}
          >
            Creation Fee
          </span>
          {activeTab === "creation" && (
            <div className="absolute bottom-0 left-0 h-1 w-full rounded-full bg-active" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("settlement")}
          className="relative pb-1 text-lg font-medium transition-colors"
        >
          <span
            className={clsx(
              "transition-colors",
              activeTab === "settlement"
                ? "text-foreground"
                : "text-greyed/50 hover:text-greyed",
            )}
          >
            Settlement fee
          </span>
          {activeTab === "settlement" && (
            <div className="absolute bottom-0 left-0 h-1 w-full rounded-full bg-active" />
          )}
        </button>
      </div>

      {/* Table */}
      {activeTab === "creation" && (
        <FeeTable
          rows={feeRows}
          isLoading={isLoadingList}
          page={creationPage}
          totalCount={listData?.total ?? 0}
          onPageChange={setCreationPage}
        />
      )}
      {activeTab === "settlement" && (
        <FeeTable
          rows={feeRows}
          isLoading={isLoadingList}
          page={settlementPage}
          totalCount={listData?.total ?? 0}
          onPageChange={setSettlementPage}
        />
      )}

      <StatBoxDialog
        type={dialogType}
        statsData={statsData}
        listRows={feeRows}
        chainId={chainId}
        onClose={() => setDialogType(null)}
      />
    </div>
  );
};

export default AdminRevenueFeeStats;
