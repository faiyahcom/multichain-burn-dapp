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
import { useState, useEffect, useMemo, use } from "react";
import { Spinner } from "@/components/ui/spinner";
import TokenDisplay from "../token-display";
import { cn } from "@/lib/utils";
import {
  getVariantBorderClassName,
  getVariantShadowClassName,
  getVariantBtnBg50ClassName,
  getVariantBtnBgClassName,
} from "./container";
import { ChevronDownIcon } from "lucide-react";
import TokenImage from "../token-image";
import { PoolKindCodeEnum } from "@/types/pool";

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
  icon?: string;
  itemIcon?: string;
  overwriteButtonTrigger?: string;
};

type Props = {
  value?: TokenOption | string;
  onChange: (token: TokenOption) => void;
  disabledAddress?: string;
  classNames?: WhitelistTokenSelectClassNames;
  variant?: "pair" | "burn" | "swap" | "stake";
  hasDropdownIcon?: boolean;
  showDetail?: boolean;
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
  hasDropdownIcon = true,
  showDetail = true,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [textSearch, setTextSearch] = useState("");

  const selectedNetworkId = useSystemStore((state) => state.selectedNetworkId);
  const networkConfig = NETWORK_CONFIGS.find((n) => n.id === selectedNetworkId);

  const nativeCurrency = networkConfig?.appKitNetwork.nativeCurrency;
  const isSolana = selectedNetworkId === "solana";
  const nativeAddress = isSolana ? WSOL_ADDRESS : ZERO_ADDRESS;

  const kinds = useMemo(() => {
    switch (variant) {
      case "burn":
        return [PoolKindCodeEnum.Burn].join(",");
      case "swap":
        return [PoolKindCodeEnum.Swap].join(",");
      case "stake":
        return [PoolKindCodeEnum.Stake].join(",");
      default:
        return undefined;
    }
  }, [variant]);

  const { data: whitelistTokens, isPending: isLoading } = useGetWhitelistTokens(
    {
      search: textSearch || undefined,
      chainIds: networkConfig?.backendChainId,
      active: "1",
      isDropped: "0",
      kinds: kinds,
    },
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) setTextSearch("");
    setOpen(open);
  };

  // ✅ Native token as full object
  const nativeToken: TokenOption | null = useMemo(
    () =>
      nativeCurrency
        ? {
            address: nativeAddress,
            name: nativeCurrency.name,
            symbol: nativeCurrency.symbol,
            imageUri: networkConfig?.iconSrc ?? "",
            isNative: true,
          }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      nativeAddress,
      nativeCurrency?.name,
      nativeCurrency?.symbol,
      networkConfig?.iconSrc,
    ],
  );

  const showNativeToken =
    !!nativeToken &&
    (nativeToken.symbol.toLowerCase().includes(textSearch.toLowerCase()) ||
      nativeToken.name.toLowerCase().includes(textSearch.toLowerCase()) ||
      textSearch.length === 0);

  // ✅ Normalize whitelist tokens into TokenOption
  const allTokens: TokenOption[] = useMemo(
    () =>
      whitelistTokens?.whitelistTokens.map((t) => ({
        address: t.address,
        name: t.name,
        symbol: t.symbol,
        imageUri: t.imageUri,
        customName: t.customName,
        customSymbol: t.customSymbol,
      })) || [],
    [whitelistTokens],
  );

  const tokens = allTokens;

  // Resolve a string address to a full TokenOption.
  // allTokens changes when the user types (search filter), so we cache the last
  // successfully resolved result so the trigger button always stays populated.
  const resolvedAddress = typeof value === "string" ? value : undefined;
  const [resolvedAddressToken, setResolvedAddressToken] =
    useState<TokenOption>();
  useEffect(() => {
    if (!resolvedAddress) {
      setResolvedAddressToken(undefined);
      return;
    }
    const found =
      nativeToken?.address === resolvedAddress
        ? nativeToken
        : allTokens.find((t) => t.address === resolvedAddress);
    // Only update state when we actually found a new token — prevents looping
    if (found) {
      setResolvedAddressToken((prev) =>
        prev?.address === found.address ? prev : found,
      );
    }
  }, [resolvedAddress, allTokens, nativeToken]);

  const resolvedValue: TokenOption | undefined =
    typeof value === "string" ? resolvedAddressToken : value;

  const baseItem = "flex items-center gap-3 rounded-5px py-1.75 pr-3.5 pl-5";

  const getItemClass = (isSelected: boolean, isDisabled: boolean) => `
    ${baseItem}
    cursor-pointer border border-mb-dark-popover-item-border bg-mb-dark-popover-item rounded-5px
    ${classNames.item || ""}
    ${getVariantBtnBg50ClassName({ variant, isHover: true })}
    ${isSelected ? getVariantBtnBg50ClassName({ variant }) : ""}
    ${isSelected ? `bg- ${classNames.itemSelected || ""}` : ""}
    ${
      isDisabled
        ? `cursor-not-allowed opacity-40 ${classNames.itemDisabled || ""}`
        : ""
    }
  `;

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center justify-between gap-2 rounded-lg bg-transparent p-0 text-sm font-normal text-foreground outline-none focus-visible:ring-0 focus-visible:outline-none",
          classNames.trigger,
        )}
      >
        {resolvedValue ? (
          <div className={cn("flex items-center", classNames.triggerContent)}>
            <TokenDisplay
              symbol={resolvedValue.customSymbol ?? resolvedValue.symbol}
              customSymbol={resolvedValue.customSymbol ?? resolvedValue.symbol}
              imageUri={resolvedValue.imageUri ?? undefined}
              classNames={{ img: "size-5", container: "space-x-1" }}
            />
            {showDetail && (
              <span>
                &nbsp;{`(${resolvedValue.customName ?? resolvedValue.name})`}
              </span>
            )}
          </div>
        ) : (
          "Select Token"
        )}
        {hasDropdownIcon && (
          <ChevronDownIcon
            className={cn(
              "size-4 text-foreground transition-transform duration-300",
              open && "rotate-180",
            )}
          />
        )}
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
            className={cn(
              "mt-2 max-h-75 space-y-1 overflow-y-auto thin-transparent-scrollbar",
              classNames.list,
            )}
          >
            {/* Native */}
            {showNativeToken && nativeToken && (
              <DropdownMenuItem
                className={getItemClass(
                  resolvedValue?.address === nativeToken.address,
                  disabledAddress === nativeToken.address,
                )}
                onClick={() => {
                  if (disabledAddress === nativeToken.address) return;
                  onChange(nativeToken);
                }}
              >
                <div
                  className={cn(
                    "absolute top-1/2 left-0 h-full w-1 -translate-y-1/2 rounded-full bg-transparent",
                    getVariantBtnBgClassName({
                      variant,
                      isGroupHover: !(
                        resolvedValue?.address === nativeToken.address
                      ),
                    }),
                  )}
                />
                <img
                  src={nativeToken.imageUri}
                  className={cn(
                    "size-7.75 rounded-full",
                    classNames.icon || "",
                  )}
                />
                <div className="flex flex-col">
                  <span className="text-xs">{nativeToken.name}</span>
                  <span className="text-11px text-secondary-text">
                    {nativeToken.symbol} • Native
                  </span>
                </div>
              </DropdownMenuItem>
            )}

            {/* List */}
            {tokens.map((token) => {
              const isSelected = resolvedValue?.address === token.address;
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
                  <TokenImage
                    src={token.imageUri}
                    alt={token.customSymbol ?? token.symbol}
                    classNames={{
                      common: "size-7.75",
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs">{resolveName(token)}</span>
                    <span className="text-11px text-secondary-text">
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
