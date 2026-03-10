import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MultipleSelectOption } from "@/components/common/multiple-select";
import MultipleSelect from "@/components/common/multiple-select";
import NetworkImgIcon from "@/components/common/network-img-icon";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import { ArrowIcon } from "@/components/common/arrow-icon";
import { NETWORK_CONFIGS, networkIdToChainId } from "@/config/networks";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSystemStore } from "@/stores/systemStore";
import { transferHistoryQueryKeys } from "@/services/queries/queryKey";
import type { AnalysisItem, GetTransferAnalysisResponse } from "@/services/transferHistoryService";

// ─── Stat card ───────────────────────────────────────────────────────────────
interface StatCardProps {
  symbol: string;
  txnCount: number;
  formattedAmount: string;
}

const StatCard = ({ symbol, txnCount, formattedAmount }: StatCardProps) => (
  <div className="h-[87px] w-[276px] rounded-[15px] border-2 border-[#DEE4F6] bg-white px-6 py-4">
    <p className="text-base font-semibold">{symbol}</p>
    <p className="mt-0.5 text-sm text-secondary-text">
      {txnCount} {txnCount === 1 ? "transfer" : "transfers"} · {formattedAmount} tokens
    </p>
  </div>
);

// Mock API response (keep field names unchanged)
const MOCK_ANALYSIS_RESPONSE: GetTransferAnalysisResponse = {
  analysis: [
    {
      chainId: "11155111",
      tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      tokenSymbol: "USDC",
      tokenDecimals: 6,
      totalAmount: "47500000000",
      txnCount: 18,
    },
    {
      chainId: "11155111",
      tokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      tokenSymbol: "USDT",
      tokenDecimals: 6,
      totalAmount: "12000000",
      txnCount: 3,
    },
    {
      chainId: "11155111",
      tokenAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      tokenSymbol: "ETH",
      tokenDecimals: 18,
      totalAmount: "8500000000000000000",
      txnCount: 7,
    },
    {
      chainId: "900",
      tokenAddress: "So11111111111111111111111111111111111111112",
      tokenSymbol: "SOL",
      tokenDecimals: 9,
      totalAmount: "15200000000",
      txnCount: 12,
    },
  ],
};

function formatTokenAmount(totalAmount: string, tokenDecimals: number): string {
  const value = Number(totalAmount) / Math.pow(10, tokenDecimals);
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 4 });
}

// ─── Network single-select ───────────────────────────────────────────────────
interface NetworkOptionItemProps {
  label: string;
  iconSrc?: string;
  selected: boolean;
  onClick: () => void;
}

const NetworkOptionItem = ({ label, iconSrc, selected, onClick }: NetworkOptionItemProps) => (
  <div
    className={cn(
      "flex cursor-pointer items-stretch overflow-hidden rounded-5px transition-all",
      selected ? "bg-[#DEE4F6]" : "bg-primary-foreground",
    )}
    onClick={onClick}
  >
    <div
      className={cn(
        "w-1.75 shrink-0 rounded-r-full transition-colors",
        selected ? "bg-active" : "bg-transparent",
      )}
    />
    <div className="flex items-center gap-2.5 px-3 py-2">
      {iconSrc ? (
        <NetworkImgIcon src={iconSrc} alt={label} className="size-7.75 rounded-full" />
      ) : (
        <div className="size-7.75" />
      )}
      <span
        className={cn(
          "select-none text-15px font-medium transition-colors",
          selected && "font-bold text-active",
        )}
      >
        {label}
      </span>
    </div>
  </div>
);

interface NetworkSelectProps {
  value: string;
  onChange: (networkId: string) => void;
}

const NetworkSelect = ({ value, onChange }: NetworkSelectProps) => {
  const [open, setOpen] = useState(false);
  const selectedCfg = NETWORK_CONFIGS.find((n) => n.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={selectedCfg ? "mb-active" : "mb-inactive"} size="mb-btn">
          {selectedCfg ? (
            <span className="flex items-center justify-center gap-2">
              <NetworkImgIcon
                src={selectedCfg.iconSrc}
                alt={selectedCfg.label}
                className="size-5"
              />
              <span className="font-semibold">{selectedCfg.shortLabel}</span>
              <ArrowIcon direction="down" />
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>Network</span>
              <ArrowIcon direction="down" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="space-y-1 pb-2.5"
        align="start"
        style={{ maxHeight: "var(--radix-popover-content-available-height)" }}
      >
        <PopoverHeader className="sr-only">
          <PopoverTitle>Select Network</PopoverTitle>
          <PopoverDescription>Choose a network to filter by</PopoverDescription>
        </PopoverHeader>
        {NETWORK_CONFIGS.map((n) => (
          <NetworkOptionItem
            key={n.id}
            label={n.label}
            iconSrc={n.iconSrc}
            selected={value === n.id}
            onClick={() => {
              onChange(n.id);
              setOpen(false);
            }}
          />
        ))}
      </PopoverContent>
    </Popover>
  );
};

// ─── Main header ─────────────────────────────────────────────────────────────
const AdminTransferHistoryHeader = () => {
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [amountMin, setAmountMin] = useState<string>("");
  const [amountMax, setAmountMax] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Use chainId from user's login/connected network
  const { selectedNetworkId } = useSystemStore();
  const currentBackendChainId = useMemo(() => {
    return networkIdToChainId(selectedNetworkId) ?? undefined;
  }, [selectedNetworkId]);

  const { data: analysisData } = useQuery({
    queryKey: transferHistoryQueryKeys.analysis(),
    queryFn: async () => {
      // Mocking API for now
      await new Promise((resolve) => setTimeout(resolve, 200));
      return MOCK_ANALYSIS_RESPONSE;
    },
  });

  const filteredAnalysis: AnalysisItem[] = useMemo(() => {
    const all = analysisData?.analysis ?? [];
    if (!currentBackendChainId) return all;
    return all.filter((x) => x.chainId === currentBackendChainId);
  }, [analysisData, currentBackendChainId]);

  const tokenOptions: MultipleSelectOption[] = [];

  return (
    <div className="space-y-4 pt-12.75 pr-13.5 ">
      {/* Title */}
      <div className="space-y-1 ml-[84px]">
        <h1 className="text-3xl font-semibold">Transfer History</h1>
        <p className="text-base text-secondary-text">
          View all completed token transfers and their details
        </p>
      </div>

      {/* Stats cards */}
      <div className="flex items-stretch gap-[25px] pl-[54px]">
        {filteredAnalysis.map((item) => (
          <StatCard
            key={item.tokenAddress}
            symbol={item.tokenSymbol}
            txnCount={item.txnCount}
            formattedAmount={formatTokenAmount(item.totalAmount, item.tokenDecimals)}
          />
        ))}
      </div>

      {/* Filters row 1: token + network + search */}
      <div className="flex items-center justify-end gap-3">
        <MultipleSelect
          options={tokenOptions}
          placeholder="All Tokens"
          selected={selectedTokens}
          onChange={setSelectedTokens}
        />
        <NetworkSelect value={selectedNetwork} onChange={setSelectedNetwork} />
        <SearchTextDebouncedInput
          inputProps={{
            placeholder: "Search by name, email, wallet address, or pool name",
          }}
          value={searchText}
          onValueChange={setSearchText}
          className="sm:max-w-80.75"
        />
      </div>

      {/* Filters row 2: amount range */}
      <div className="flex items-center gap-3 pl-[54px]">
        <span className="w-16 text-sm font-medium text-secondary-text">Amount</span>
        <Input
          type="number"
          placeholder="$ Min"
          value={amountMin}
          onChange={(e) => setAmountMin(e.target.value)}
          className="w-28 px-3"
        />
        <span className="text-sm text-secondary-text">to</span>
        <Input
          type="number"
          placeholder="$ Max"
          value={amountMax}
          onChange={(e) => setAmountMax(e.target.value)}
          className="w-28 px-3"
        />
      </div>

      {/* Filters row 3: date range */}
      <div className="flex items-center gap-3 pl-[54px]">
        <span className="w-16 text-sm font-medium text-secondary-text">Date</span>
        <DatePicker value={dateFrom} onChange={setDateFrom} className="w-48" />
        <span className="text-sm text-secondary-text">to</span>
        <DatePicker value={dateTo} onChange={setDateTo} className="w-48" />
      </div>
    </div>
  );
};

export default AdminTransferHistoryHeader;
