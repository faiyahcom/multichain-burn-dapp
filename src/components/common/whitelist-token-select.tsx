import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowIcon } from "@/components/common/arrow-icon";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import { useGetWhitelistTokens } from "@/services/queries/queries";

import { useSystemStore } from "@/stores/systemStore";
import { NETWORK_CONFIGS } from "@/config/networks";
import { WSOL_ADDRESS, ZERO_ADDRESS } from "@/config/constant";
import { truncateString } from "@/utils/helpers/string";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Spinner } from "../ui/spinner";
import { whitelistQueryKeys } from "@/services/queries/queryKey";
import { cn } from "@/lib/utils";
import TokenImage from "./token-image";

type Props = {
  value?: string;
  onChange: (address: string) => void;
  disabledAddress?: string;
  poolKind?: number;
  btnProps?: React.ComponentProps<typeof Button>;
};

const resolveSymbol = (token: { symbol: string; customSymbol?: string }) =>
  token.customSymbol?.trim() || token.symbol;

const resolveName = (token: { name: string; customName?: string }) =>
  token.customName?.trim() || token.name;

const WhitelistTokenSelect = ({
  value,
  onChange,
  disabledAddress,
  poolKind,
  btnProps,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [textSearch, setTextSearch] = useState("");
  const selectedNetworkId = useSystemStore((state) => state.selectedNetworkId);
  const queryClient = useQueryClient();

  const networkConfig = NETWORK_CONFIGS.find((n) => n.id === selectedNetworkId);
  const nativeCurrency = networkConfig?.appKitNetwork.nativeCurrency;
  const isSolana = selectedNetworkId === "solana";
  const nativeAddress = isSolana ? WSOL_ADDRESS : ZERO_ADDRESS;

  const {
    data: whitelistTokens,
    isPending,
    isFetching,
  } = useGetWhitelistTokens({
    search: textSearch || undefined,
    chainIds: networkConfig?.backendChainId,
    active: "1",
    isDropped: "0",
    kinds: poolKind !== undefined ? String(poolKind) : undefined,
  });

  const isLoading = isPending || (open && isFetching);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTextSearch("");
    } else {
      void queryClient.invalidateQueries({
        queryKey: whitelistQueryKeys.listTokens().filter(Boolean),
      });
    }
    setOpen(open);
  };

  // Native token entry shown at top of list
  const nativeToken = nativeCurrency
    ? {
      address: nativeAddress,
      name: nativeCurrency.name,
      symbol: nativeCurrency.symbol,
      imageUri: networkConfig?.iconSrc ?? "",
    }
    : null;

  // Show native token if search text is empty or matches native token symbol or name
  const showNativeToken =
    !!nativeToken &&
    (nativeToken.symbol
      .toLocaleLowerCase()
      .includes(textSearch.toLocaleLowerCase()) ||
      nativeToken.name
        .toLocaleLowerCase()
        .includes(textSearch.toLocaleLowerCase()) ||
      textSearch.length === 0);

  const selectedDetail =
    value === nativeAddress
      ? nativeToken
      : whitelistTokens?.whitelistTokens.find(
        (token) => token.address === value,
      );

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center justify-between gap-2 rounded-lg bg-inactive text-sm font-normal text-foreground hover:bg-inactive/80"
          {...btnProps}
        >
          {value && selectedDetail ? (
            <div className="flex items-center gap-4">
              <TokenImage
                classNames={{
                  common: "size-6 rounded-full",
                }}
                src={selectedDetail.imageUri}
                alt={selectedDetail.name}
              />
              <span>{`${resolveSymbol(selectedDetail)} (${resolveName(selectedDetail)})`}</span>
            </div>
          ) : (
            "Select Token"
          )}
          <ArrowIcon direction="down" className="text-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-(--radix-dropdown-menu-trigger-width) rounded-lg px-3 pt-3 pb-4"
        style={{
          maxHeight: "var(--radix-dropdown-menu-content-available-height)",
        }}
      >
        <SearchTextDebouncedInput
          className="bg-primary-foreground"
          value={textSearch}
          onValueChange={setTextSearch}
          inputProps={{
            placeholder: "Search Token",
            onKeyDown: (e) => e.stopPropagation(), // Prevent dropdown menu behavior of switch focus to matching item
          }}
        />
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Spinner />
          </div>
        ) : (
          <div className="mt-2 max-h-[calc(var(--radix-dropdown-menu-content-available-height)*0.7)] space-y-1 overflow-y-auto">
            {showNativeToken && (
              <DropdownMenuItem
                key={nativeAddress}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-5px py-1.75 pr-3.5 pl-5",
                  {
                    "bg-inactive font-semibold text-active":
                      value === nativeAddress,
                  },
                  {
                    "cursor-not-allowed opacity-40":
                      disabledAddress === nativeAddress,
                  },
                )}
                leftSelectedPanelClassName="w-1.5"
                isSelected={value === nativeAddress}
                disabled={disabledAddress === nativeAddress}
                onClick={() => {
                  if (disabledAddress !== nativeAddress) {
                    onChange(nativeAddress);
                  }
                }}
              >
                <TokenImage
                  classNames={{
                    common: "size-7.75 rounded-full",
                  }}
                  src={nativeToken.imageUri}
                  alt={nativeToken.symbol}
                />
                <div className="flex flex-col">
                  <span className="text-xs">{nativeToken.name}</span>
                  <div className="flex gap-1.25">
                    <span className="text-[11px] font-normal text-secondary-text">
                      {nativeToken.symbol}
                    </span>
                    <span className="text-tiny font-light text-secondary-text/80">
                      Native
                    </span>
                  </div>
                </div>
              </DropdownMenuItem>
            )}
            {whitelistTokens?.whitelistTokens.map((token) => {
              const isSelected = value === token.address;
              const isDisabled = disabledAddress === token.address;
              return (
                <DropdownMenuItem
                  key={token.address}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-5px py-1.75 pr-3.5 pl-5",
                    {
                      "bg-inactive font-semibold text-active": isSelected,
                    },
                    {
                      "cursor-not-allowed opacity-40": isDisabled,
                    },
                  )}
                  leftSelectedPanelClassName="w-1.5"
                  isSelected={isSelected}
                  disabled={isDisabled}
                  onClick={() => {
                    if (!isDisabled) {
                      onChange(token.address);
                    }
                  }}
                >
                  <TokenImage
                    classNames={{
                      common: "size-7.75 rounded-full",
                    }}
                    src={token.imageUri}
                    alt={token.symbol}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs">{resolveName(token)}</span>
                    <div className="flex gap-1.25">
                      <span className="text-[11px] font-normal text-secondary-text">
                        {resolveSymbol(token)}
                      </span>
                      <span className="text-tiny font-light text-secondary-text/80">
                        {truncateString({ str: token.address })}
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
            {whitelistTokens?.whitelistTokens.length === 0 &&
              !showNativeToken && (
                <div className="flex items-center justify-center py-4">
                  No tokens available
                </div>
              )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WhitelistTokenSelect;
