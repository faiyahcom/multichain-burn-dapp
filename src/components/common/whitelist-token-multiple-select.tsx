import { WSOL_ADDRESS, ZERO_ADDRESS } from "@/config/constant";
import { NETWORK_CONFIGS } from "@/config/networks";
import { cn } from "@/lib/utils";
import { whitelistQueryKeys } from "@/services/queries/queryKey";
import { whitelistService } from "@/services/whitelistService";
import type { PoolType } from "@/types/admin/master-pool-management";
import { truncateString } from "@/utils/helpers/string";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { CircleXIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useIntersectionObserver } from "usehooks-ts";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../ui/popover";
import { Spinner } from "../ui/spinner";
import { ArrowIcon } from "./arrow-icon";
import CenterSpinner from "./center-spinner";
import NoData from "./no-data";
import SearchTextDebouncedInput from "./search-text-debounced-input";
import TokenImage from "./token-image";
import MultipleSplitTokenImage from "./multiple-split-token-image";

interface Props {
  value?: string[];
  onChange?: (value: string[]) => void;
  poolType?: PoolType;
  btnProps?: React.ComponentProps<typeof Button>;
}

const limit = 10;
const allTokens = "All Tokens";
// By default, if no token is selected, then treat it as "All Tokens"

const WhitelistTokenMultipleSelect: React.FC<Props> = ({
  value,
  onChange,
  poolType,
  btnProps,
}) => {
  const [open, setOpen] = useState(false);
  const [tokenTextSearch, setTokenTextSearch] = useState("");
  const isAnySelected = (value?.length ?? 0) > 0;
  const queryClient = useQueryClient();
  const { isIntersecting, ref } = useIntersectionObserver({
    threshold: 0.5,
  });

  const {
    data: tokenData,
    isPending: isPendingTokens,
    hasNextPage: hasNextPageTokens,
    isFetchingNextPage: isFetchingNextPageTokens,
    fetchNextPage: fetchNextPageTokens,
  } = useInfiniteQuery({
    queryKey: whitelistQueryKeys.listTokens({
      infinite: true,
      search: tokenTextSearch,
    }),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      return whitelistService.getListTokens({
        page: pageParam,
        limit: limit,
        active: "true",
        isDropped: "false",
        search: tokenTextSearch || undefined,
        kinds: poolType !== undefined ? String(poolType) : undefined,
      });
    },
    enabled: open,
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.page;
      const totalItems = lastPage.total;
      return currentPage * limit < totalItems ? currentPage + 1 : undefined;
    },
  });

  useEffect(() => {
    if (!isFetchingNextPageTokens && hasNextPageTokens && isIntersecting) {
      fetchNextPageTokens();
    }
  }, [isFetchingNextPageTokens, hasNextPageTokens, isIntersecting]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTokenTextSearch("");
    } else {
      void queryClient.invalidateQueries({
        queryKey: whitelistQueryKeys.listTokens().filter(Boolean),
      });
    }
    setOpen(open);
  };

  const handleToggleCheck = (toggleValue?: string) => {
    if (!toggleValue) return;
    const isIncluded = value?.includes(toggleValue);
    if (isIncluded) {
      onChange?.(value?.filter((v) => v !== toggleValue) ?? []);
    } else {
      onChange?.([...(value ?? []), toggleValue]);
    }
  };

  const nativeTokens = NETWORK_CONFIGS.map((network) => ({
    address: network.id === "solana" ? WSOL_ADDRESS : ZERO_ADDRESS,
    name: network.appKitNetwork.nativeCurrency.name,
    symbol: network.appKitNetwork.nativeCurrency.symbol,
    imageUri: network.iconSrc ?? "",
  })).filter(
    (token) =>
      tokenTextSearch.length === 0 ||
      token.symbol
        .toLocaleLowerCase()
        .includes(tokenTextSearch.toLocaleLowerCase()) ||
      token.name
        .toLocaleLowerCase()
        .includes(tokenTextSearch.toLocaleLowerCase()),
  );
  const whitelistTokens = tokenData?.pages?.flatMap(
    (page) => page.whitelistTokens,
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={"mb-active"}
          size={"mb-btn"}
          title={isAnySelected ? `Selected: ${value?.join(", ")}` : allTokens}
          {...btnProps}
        >
          {isAnySelected ? (
            <span className="min-w-0 truncate">{value?.length} selected</span>
          ) : (
            allTokens
          )}
          <ArrowIcon direction="down" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("space-y-1 overflow-y-auto")}
        // https://www.radix-ui.com/primitives/docs/components/popover#constrain-the-content-size
        style={{
          maxHeight: "var(--radix-popover-content-available-height)",
        }}
      >
        <PopoverHeader className="sr-only">
          <PopoverTitle>Select multiple tokens</PopoverTitle>
          <PopoverDescription>Select multiple tokens</PopoverDescription>
        </PopoverHeader>
        <SearchTextDebouncedInput
          value={tokenTextSearch}
          onValueChange={setTokenTextSearch}
          inputProps={{
            placeholder: "Search token",
            className:
              "text-15px font-medium placeholder:text-15px placeholder:font-medium px-[25px]",
          }}
          addons={null}
          className="h-auto rounded-5px! border border-active bg-primary-foreground py-1"
        />
        {isAnySelected && (
          <div className="flex flex-wrap items-center gap-0.5">
            <span>Selected:</span>
            {value?.map((token) => (
              <div
                className="flex items-center gap-0.5 rounded-full bg-active/50 p-1 pl-2 text-active"
                key={token}
              >
                <span title={token} className="text-xs">
                  {truncateString({ str: token })}
                </span>
                <button
                  className="shrink-0"
                  onClick={() => handleToggleCheck(token)}
                >
                  <CircleXIcon />
                </button>
              </div>
            ))}
          </div>
        )}
        <CenterSpinner isLoading={isPendingTokens} />
        <NoData
          data={[...nativeTokens, ...(whitelistTokens ?? [])]}
          isLoading={isPendingTokens}
          text="No tokens found"
        />
        {/* Some native tokens have the same address, 
          if we just display them like whitelist tokens,
          when clicking any one if them, it will toggle all of them.
          This is bad UX, so we need to group them by address.
        */}
        {Object.entries(
          nativeTokens.reduce<
            Record<string, { name: string[]; img: string[] }>
          >((acc, { address, name, imageUri }) => {
            (acc[address] ??= { name: [], img: [] }).name.push(name);
            acc[address].img.push(imageUri);
            return acc;
          }, {}),
        ).map(([address, { name, img }], index) => {
          const isSelected = value?.includes(address);
          return (
            <OptionItem
              key={`native-${address}-${index}`}
              label={name}
              value={address}
              checked={isSelected}
              toggleCheck={handleToggleCheck}
              imgSrc={img}
            />
          );
        })}
        {whitelistTokens?.map((token, index) => {
          const isSelected = value?.includes(token.address);
          return (
            <OptionItem
              key={`${token.address}-${index}`}
              label={token.customName ?? token.name}
              value={token.address}
              checked={isSelected}
              toggleCheck={handleToggleCheck}
              imgSrc={token.imageUri}
            />
          );
        })}
        {hasNextPageTokens && (
          <div
            className="flex w-full items-center justify-center py-2.5"
            ref={ref}
          >
            {isFetchingNextPageTokens && <Spinner />}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

interface OptionItemCommonProps {
  checked?: boolean;
  toggleCheck?: (value?: string) => void;
  value: string;
}

type OptionItemDiffProps =
  | {
      label: string;
      imgSrc: string;
    }
  | {
      label: string[];
      imgSrc: string[];
    };

type OptionItemProps = OptionItemCommonProps & OptionItemDiffProps;

const OptionItem: React.FC<OptionItemProps> = ({
  label,
  value,
  checked,
  toggleCheck,
  imgSrc,
}) => {
  const displayLabel = Array.isArray(label) ? label.join(", ") : label;

  return (
    <div
      className="cursor-pointer rounded-5px bg-primary-foreground py-0.5 pr-0.75"
      onClick={() => toggleCheck?.(value)}
    >
      <div className="relative pl-1">
        <div
          className={cn(
            "absolute top-0 left-0 h-full w-1.75 rounded-full bg-transparent transition-colors",
            { "bg-active": checked },
          )}
        />
        <div
          className={cn(
            "flex items-center rounded-5px bg-transparent pt-2 pb-1.75 pl-6.25 transition-colors",
            { "bg-inactive": checked },
          )}
        >
          <div className="flex items-center gap-2.25">
            {typeof imgSrc === "string" && typeof label === "string" && (
              <TokenImage
                src={imgSrc}
                alt={label}
                classNames={{
                  common: "size-7.75",
                }}
              />
            )}
            {Array.isArray(imgSrc) && Array.isArray(label) && (
              <MultipleSplitTokenImage
                imgs={imgSrc}
                labels={label}
                classNames={{
                  common: "size-7.75",
                }}
              />
            )}
            <p
              className="min-w-0 truncate text-15px font-medium"
              title={displayLabel}
            >
              {displayLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhitelistTokenMultipleSelect;
