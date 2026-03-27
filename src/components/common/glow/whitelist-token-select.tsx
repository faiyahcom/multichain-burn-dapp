import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import { useGetWhitelistTokens } from "@/services/queries/queries";

import { useSystemStore } from "@/stores/systemStore";
import { NETWORK_CONFIGS } from "@/config/networks";
import { WSOL_ADDRESS, ZERO_ADDRESS } from "@/config/constant";
import { truncateString } from "@/utils/helpers/string";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import TokenDisplay from "../token-display";
import { cn } from "@/lib/utils";
import {
  getVariantBorderClassName,
  getVariantShadowClassName,
  getVariantBgClassName,
  getVariantBtnBg50ClassName,
  getVariantBtnBgClassName,
} from "./container";

export type TokenOption = {
  address: string;
  name: string;
  symbol: string;
  imageUri: string;
  customSymbol?: string;
  customName?: string;
  isNative?: boolean;
};

type WhitelistTokenSelectClassNames = {
  trigger?: string;
  triggerContent?: string;
  dropdown?: string;
  search?: string;
  list?: string;
  item?: string;
  itemSelected?: string;
  itemDisabled?: string;
};

type Props = {
  value?: TokenOption;
  onChange: (token: TokenOption) => void;
  disabledAddress?: string;
  classNames?: WhitelistTokenSelectClassNames;
  variant?: "pair" | "burn" | "swap";
};

const resolveSymbol = (token: TokenOption) =>
  token.customSymbol?.trim() || token.symbol;

const resolveName = (token: TokenOption) =>
  token.customName?.trim() || token.name;

const WhitelistTokenSelect = ({
  value,
  onChange,
  disabledAddress,
  classNames = {},
  variant = "swap",
}: Props) => {
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
    if (!open) setTextSearch("");
    setOpen(open);
  };

  // ✅ Native token as full object
  const nativeToken: TokenOption | null = nativeCurrency
    ? {
      address: nativeAddress,
      name: nativeCurrency.name,
      symbol: nativeCurrency.symbol,
      imageUri: networkConfig?.iconSrc ?? "",
      isNative: true,
    }
    : null;

  const showNativeToken =
    !!nativeToken &&
    (nativeToken.symbol.toLowerCase().includes(textSearch.toLowerCase()) ||
      nativeToken.name.toLowerCase().includes(textSearch.toLowerCase()) ||
      textSearch.length === 0);

  // ✅ Normalize whitelist tokens into TokenOption
  const tokens: TokenOption[] =
    whitelistTokens?.whitelistTokens.map((t) => ({
      address: t.address,
      name: t.name,
      symbol: t.symbol,
      imageUri: t.imageUri,
      customName: t.customName,
      customSymbol: t.customSymbol,
    })) || [];

  const baseItem = "flex items-center gap-3 rounded-5px py-1.75 pr-3.5 pl-5";

  const getItemClass = (isSelected: boolean, isDisabled: boolean) => `
    ${baseItem}
    cursor-pointer border border-mb-dark-popover-item-border bg-mb-dark-popover-item rounded-5px
    ${classNames.item || ""}
    ${getVariantBtnBg50ClassName({ variant, isHover: true })}
    ${isSelected ? getVariantBtnBg50ClassName({ variant }) : ""}
    ${isSelected ? `bg- ${classNames.itemSelected || ""}` : ""}
    ${isDisabled
      ? `cursor-not-allowed opacity-40 ${classNames.itemDisabled || ""}`
      : ""
    }
  `;

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`flex items-center justify-between gap-2 rounded-lg bg-transparent p-0 text-sm font-normal text-foreground ${classNames.trigger || ""
            }`}
        >
          {value ? (
            <div
              className={`flex items-center gap-4 ${classNames.triggerContent || ""
                }`}
            >
              <TokenDisplay
                symbol={value.customSymbol ?? value.symbol}
                customSymbol={value.customSymbol ?? value.symbol}
                imageUri={value.imageUri ?? undefined}
                classNames={{ img: "size-5", container: "space-x-1" }}
              />
            </div>
          ) : (
            "Select Token"
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className={cn(
          getVariantBorderClassName({ variant }),
          getVariantShadowClassName({ variant }),
          `rounded-5px bg-mb-dark-popover px-3 pt-3 pb-4 font-inter ${classNames.dropdown || ""}`,
        )}
      >
        <SearchTextDebouncedInput
          className={`border border-mb-dark-popover-item-border bg-mb-dark-popover-item ${classNames.search || ""}`}
          value={textSearch}
          onValueChange={setTextSearch}
          inputProps={{
            placeholder: "Search Token",
            onKeyDown: (e) => e.stopPropagation(),
          }}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Spinner />
          </div>
        ) : (
          <div
            className={`mt-2 max-h-[300px] space-y-1 overflow-y-auto ${classNames.list || ""
              }`}
          >
            {/* Native */}
            {showNativeToken && nativeToken && (
              <DropdownMenuItem
                className={getItemClass(
                  value?.address === nativeToken.address,
                  disabledAddress === nativeToken.address,
                )}
                onClick={() => onChange(nativeToken)}
              >
                <div
                  className={cn(
                    "absolute top-1/2 left-0 h-full w-1 -translate-y-1/2 rounded-full bg-transparent",
                    getVariantBtnBgClassName({
                      variant,
                      isGroupHover: !(value?.address === nativeToken.address),
                    }),
                  )}
                />
                <img
                  src={nativeToken.imageUri}
                  className="size-7.75 rounded-full"
                />
                <div className="flex flex-col">
                  <span className="text-xs">{nativeToken.name}</span>
                  <span className="text-[11px] text-secondary-text">
                    {nativeToken.symbol} • Native
                  </span>
                </div>
              </DropdownMenuItem>
            )}

            {/* List */}
            {tokens.map((token) => {
              const isSelected = value?.address === token.address;
              const isDisabled = disabledAddress === token.address;

              return (
                <DropdownMenuItem
                  key={token.address}
                  className={getItemClass(isSelected, isDisabled)}
                  onClick={() => !isDisabled && onChange(token)}
                >
                  <div
                    className={cn(
                      "absolute top-1/2 left-0 h-full w-1 -translate-y-1/2 rounded-full bg-transparent",
                      getVariantBtnBgClassName({
                        variant,
                        isGroupHover: !isSelected,
                      }),
                    )}
                  />
                  <img
                    src={token.imageUri}
                    className="size-7.75 rounded-full"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs">{resolveName(token)}</span>
                    <span className="text-[11px] text-secondary-text">
                      {resolveSymbol(token)} •{" "}
                      {truncateString({ str: token.address })}
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WhitelistTokenSelect;
