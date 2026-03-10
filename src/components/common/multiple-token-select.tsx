import { whitelistQueryKeys } from "@/services/queries/queryKey";
import {
  whitelistService,
  type ListTokensRequest,
  type WhitelistToken,
} from "@/services/whitelistService";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useIntersectionObserver } from "usehooks-ts";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../ui/popover";
import { Button } from "../ui/button";
import { ArrowIcon } from "./arrow-icon";
import { cn } from "@/lib/utils";
import { IconCheck, IconSquare, IconSquareCheck } from "@/assets/react";
import TokenImage from "./token-image";
import { truncateString } from "@/utils/helpers/string";
import { Spinner } from "../ui/spinner";
import NoData from "./no-data";
import { useEffect, useState } from "react";
import SearchTextDebouncedInput from "./search-text-debounced-input";

interface Props {
  selected?: string[];
  onChange?: (value: string[]) => void;
  classNames?: {
    btn?: string;
    content?: string;
  };
  whitelistTokensRequest?: ListTokensRequest;
}

const limit = 10;
const allTokens = "All Tokens";
// By default, if no token is selected, then treat it as "All Tokens"

const MultipleTokenSelect: React.FC<Props> = ({
  selected,
  onChange,
  classNames,
  whitelistTokensRequest,
}) => {
  const [open, setOpen] = useState(false);
  const [tokenTextSearch, setTokenTextSearch] = useState("");
  const isAnySelected = (selected?.length ?? 0) > 0;

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
      ...whitelistTokensRequest,
    }),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      return whitelistService.getListTokens({
        page: pageParam,
        limit: limit,
        active: "true",
        isDropped: "false",
        search: tokenTextSearch || undefined,
        ...whitelistTokensRequest,
      });
    },
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

  const selectedTokens =
    tokenData?.pages
      ?.flatMap((page) => page.whitelistTokens)
      ?.filter((token) => selected?.includes(token.address)) ?? [];

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTokenTextSearch("");
    }
    setOpen(open);
  };

  const handleClearAllCheck = () => {
    onChange?.([]);
  };

  const handleToggleCheck = (value?: string) => {
    if (!value) return;
    const isIncluded = selected?.includes(value);
    if (isIncluded) {
      onChange?.(selected?.filter((v) => v !== value) ?? []);
    } else {
      onChange?.([...(selected ?? []), value]);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={"mb-active"}
          size={"mb-btn"}
          title={
            isAnySelected
              ? `Selected: ${selectedTokens?.map((token) => token.customName ?? token.name)?.join(", ")}`
              : allTokens
          }
          className={classNames?.btn}
        >
          <div className="size-2.5" />
          {isAnySelected ? (
            <span className="min-w-0 truncate">
              {selected?.length} selected
            </span>
          ) : (
            allTokens
          )}
          <ArrowIcon direction="down" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("space-y-6 pb-6.75", classNames?.content)}
        // https://www.radix-ui.com/primitives/docs/components/popover#constrain-the-content-size
        style={{
          maxHeight: "var(--radix-popover-content-available-height)",
        }}
      >
        <PopoverHeader className="sr-only">
          <PopoverTitle>Select</PopoverTitle>
          <PopoverDescription>Select multiple options</PopoverDescription>
        </PopoverHeader>
        {/* 
            content max height - padding top (9px) - footer clear all (24px + 24px + 27px) - input search (24px + 34px)
            content max height - 142px (35.5 spacing)
        */}
        <SearchTextDebouncedInput
          inputProps={{
            placeholder: "Search token",
          }}
          value={tokenTextSearch}
          onValueChange={(text) => setTokenTextSearch(text)}
        />
        <div className="max-h-[calc(var(--radix-popover-content-available-height)-var(--spacing)*35.5)] space-y-1 overflow-y-auto">
          <NoData
            data={
              tokenData?.pages?.flatMap((page) => page.whitelistTokens) ?? []
            }
            isLoading={isPendingTokens || isFetchingNextPageTokens}
          />
          {tokenData?.pages?.map((page) =>
            page.whitelistTokens.map((token) => (
              <OptionItem
                key={token.address}
                token={token}
                value={token.address}
                checked={selected?.includes(token.address)}
                toggleCheck={handleToggleCheck}
              />
            )),
          )}
          {hasNextPageTokens && (
            <div
              className="flex w-full items-center justify-center py-2.5"
              ref={ref}
            >
              {isFetchingNextPageTokens && <Spinner />}
            </div>
          )}
        </div>
        <div className="pl-3">
          <button
            className="text-15px font-medium text-mb-clear-blue"
            onClick={handleClearAllCheck}
          >
            Clear All
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface OptionItemProps {
  value?: string;
  checked?: boolean;
  toggleCheck?: (value?: string) => void;
  token?: WhitelistToken;
}

const OptionItem: React.FC<OptionItemProps> = ({
  value,
  token,
  checked,
  toggleCheck,
}) => {
  return (
    <div
      className="flex cursor-pointer items-center justify-between gap-2.5 rounded-5px bg-primary-foreground px-4 pt-2 pb-1.75"
      onClick={() => toggleCheck?.(value)}
    >
      <div className="flex items-center gap-2.5">
        {checked ? (
          <IconSquareCheck className="size-4.5 text-mb-check-blue" />
        ) : (
          <IconSquare className="size-4.5 text-mb-check-blue" />
        )}
        <TokenImage
          src={token?.imageUri}
          alt={token?.customName ?? token?.name}
          classNames={{
            common: "size-7.75",
          }}
        />
        <div>
          <p className="text-15px font-normal">
            {token?.customName ?? token?.name}
          </p>
          <div className="flex items-center gap-1.25">
            <p className="text-11px font-normal text-secondary-text">
              {token?.customSymbol ?? token?.symbol}
            </p>
            <p className="text-tiny font-light text-secondary-text">
              {truncateString({ str: token?.address })}
            </p>
          </div>
        </div>
      </div>
      {checked ? (
        <IconCheck className="h-2.5 w-3.75 text-mb-check-blue" />
      ) : (
        <div className="size-4" />
      )}
    </div>
  );
};

export default MultipleTokenSelect;
