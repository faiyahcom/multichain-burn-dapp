import { IconTokenList } from "@/assets/react";
import GlowContainer, { type ContainerVariant } from "./container";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { whitelistQueryKeys } from "@/services/queries/queryKey";
import {
  whitelistService,
  type WhitelistToken,
} from "@/services/whitelistService";
import { useInfiniteQuery } from "@tanstack/react-query";
import TokenImage from "../token-image";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { chainIdToNetworkConfig } from "@/config/networks";
import { useIntersectionObserver } from "usehooks-ts";
import { useEffect, useRef } from "react";

interface Props {
  variant: ContainerVariant;
  onTokenClick?: (token: WhitelistToken) => void;
}

const TokenListGlow: React.FC<Props> = ({ variant, onTokenClick }) => {
  const buttonClassName =
    "flex size-10 shrink-0 items-center justify-center rounded-full bg-[#3C404F]/40 xl:size-15";
  const limit = 20;
  const { isIntersecting, ref } = useIntersectionObserver({
    threshold: 0.5,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    data: tokenData,
    isPending: isPendingTokens,
    hasNextPage: hasNextPageTokens,
    isFetchingNextPage: isFetchingNextPageTokens,
    fetchNextPage: fetchNextPageTokens,
  } = useInfiniteQuery({
    queryKey: whitelistQueryKeys.listTokens({
      infinite: true,
    }),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      return whitelistService.getListTokens({
        page: pageParam,
        limit: limit,
        active: "true",
        isDropped: "false",
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

  const scroll = (direction: "prev" | "next") => {
    const container = containerRef.current;
    if (!container) return;

    // size-10 = 40px, size-15 = 60px, gap-3 = 12px, gap-6 = 24px
    const isXl = window.innerWidth >= 1280;
    const itemSize = isXl ? 60 : 40;
    const gap = isXl ? 24 : 12;
    const scrollAmount = itemSize + gap;

    container.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <GlowContainer
      variant={variant}
      className="flex items-center gap-3 px-2.5 py-3.25 xl:gap-12 xl:px-5 xl:py-6.25"
    >
      <div className="flex w-30 shrink-0 items-center gap-1.75 xl:w-56.75 xl:gap-3.25">
        <IconTokenList className="shrink-0" />
        <div className="text-center text-md font-medium xl:shrink-0 xl:text-2xl">
          TOKENS LIST
        </div>
      </div>

      {/* 
        desktop:
        100% - spacing * (5 + 12 + 56.75) = 100% - spacing * 73.75
        mobile:
        100% - spacing * (2.5 + 3 + 27) = 100% - spacing * 32.5
      */}
      <div className="flex w-[calc(100%-var(--spacing)*32.5)] items-center gap-3 xl:w-[calc(100%-var(--spacing)*73.75)] xl:gap-6">
        <button className={buttonClassName} onClick={() => scroll("prev")}>
          <ChevronLeftIcon className="size-6.25 text-[#7B879F] xl:size-8.75" />
        </button>
        {/* 
            desktop:
            100% - spacing * (8.75 * 2 + 6 * 2) = 100% - spacing * 29.5
            mobile:
            100% - spacing * (6.25 * 2 + 3 * 2) = 100% - spacing * 18.5
        */}
        <div
          className="flex w-[calc(100%-var(--spacing)*18.5)] snap-x snap-mandatory items-center gap-3 overflow-x-auto xl:w-[calc(100%-var(--spacing)*29.5)] xl:gap-6"
          style={{
            scrollbarWidth: "none",
          }}
          ref={containerRef}
        >
          {tokenData?.pages?.map((page) =>
            page?.whitelistTokens?.map((token) => {
              const tokenDisplay = resolvePoolTokenDisplay({
                imageUri: token.imageUri,
                tokenName: token.name,
                tokenSymbol: token.symbol,
                customName: token.customName,
                customSymbol: token.customSymbol,
                network: chainIdToNetworkConfig(token.chainId),
                tokenAddress: token.address,
              });
              return (
                <button
                  key={token.address}
                  title={token.address}
                  className="shrink-0 snap-start"
                  onClick={() => onTokenClick?.(token)}
                >
                  <TokenImage
                    src={tokenDisplay.imageUri}
                    alt={tokenDisplay.name}
                    classNames={{
                      common: "size-10 xl:size-15",
                    }}
                  />
                </button>
              );
            }),
          )}
          {(isPendingTokens || hasNextPageTokens) && (
            <div className="size-10 xl:size-15" ref={ref}>
              {(isPendingTokens || isFetchingNextPageTokens) && (
                <TokenImage
                  isLoading
                  classNames={{
                    common: "size-10 xl:size-15",
                  }}
                />
              )}
            </div>
          )}
        </div>
        <button className={buttonClassName} onClick={() => scroll("next")}>
          <ChevronRightIcon className="size-6.25 text-[#7B879F] xl:size-8.75" />
        </button>
      </div>
    </GlowContainer>
  );
};

export default TokenListGlow;
