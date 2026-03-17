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
import { Spinner } from "../ui/spinner";

type Props = {
  value?: string;
  onChange: (address: string) => void;
  disabledAddress?: string;
};

const resolveSymbol = (token: { symbol: string; customSymbol?: string }) =>
  token.customSymbol?.trim() || token.symbol;

const resolveName = (token: { name: string; customName?: string }) =>
  token.customName?.trim() || token.name;

const WhitelistTokenSelect = ({ value, onChange, disabledAddress }: Props) => {
  const [open, setOpen] = useState(false);
  const [textSearch, setTextSearch] = useState("");
  const selectedNetworkId = useSystemStore((state) => state.selectedNetworkId);

  const networkConfig = NETWORK_CONFIGS.find((n) => n.id === selectedNetworkId);
  const nativeCurrency = networkConfig?.appKitNetwork.nativeCurrency;
  const isSolana = selectedNetworkId === "solanaDevnet";
  const nativeAddress = isSolana ? WSOL_ADDRESS : ZERO_ADDRESS;

  const { data: whitelistTokens, isPending: isLoading } = useGetWhitelistTokens(
    {
      search: textSearch || undefined,
      chainIds: networkConfig?.backendChainId,
      active: "1",
      isDropped: "0",
    },
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTextSearch("");
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
        >
          {value && selectedDetail ? (
            <div className="flex items-center gap-4">
              <img
                className="size-6 rounded-full"
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
                className={`flex cursor-pointer items-center gap-3 rounded-5px py-1.75 pr-3.5 pl-5 hover:bg-inactive ${value === nativeAddress ? "bg-inactive font-semibold text-active" : ""} ${disabledAddress === nativeAddress ? "cursor-not-allowed opacity-40" : ""}`}
                leftSelectedPanelClassName="w-1.5"
                isSelected={value === nativeAddress}
                disabled={disabledAddress === nativeAddress}
                onClick={() => {
                  if (disabledAddress !== nativeAddress) {
                    onChange(nativeAddress);
                  }
                }}
              >
                <img
                  src={nativeToken.imageUri}
                  alt={nativeToken.symbol}
                  className="size-7.75 rounded-full"
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
                  className={`flex cursor-pointer items-center gap-3 rounded-5px py-1.75 pr-3.5 pl-5 hover:bg-inactive ${isSelected ? "bg-inactive font-semibold text-active" : ""} ${isDisabled ? "cursor-not-allowed opacity-40" : ""}`}
                  leftSelectedPanelClassName="w-1.5"
                  isSelected={isSelected}
                  disabled={isDisabled}
                  onClick={() => {
                    if (!isDisabled) {
                      onChange(token.address);
                    }
                  }}
                >
                  <img
                    src={token.imageUri}
                    alt={token.symbol}
                    className="size-7.75 rounded-full"
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
