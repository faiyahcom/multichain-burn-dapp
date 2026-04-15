import { IconTokenList } from "@/assets/react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { chainIdToNetworkConfig, NETWORK_CONFIGS } from "@/config/networks";
import { cn } from "@/lib/utils";
import { whitelistQueryKeys } from "@/services/queries/queryKey";
import {
  whitelistService,
  type WhitelistToken,
} from "@/services/whitelistService";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { useQuery } from "@tanstack/react-query";
import TokenImage from "../token-image";
import GlowContainer, { type ContainerVariant } from "./container";
import { convertArrayToStringParam } from "@/utils/helpers/array";

interface Props {
  variant: ContainerVariant;
  onTokenClick?: (token: WhitelistToken) => void;
}

const TokenListGlow: React.FC<Props> = ({ variant, onTokenClick }) => {
  const buttonClassName =
    "flex size-10 shrink-0 items-center justify-center rounded-full bg-[#3C404F]/40 xl:size-15 text-[#7B879F] border-none";
  const limit = 100;

  // Fetches up to 300 tokens max (3 pages × 100 per page) to keep the carousel
  // performant. Beyond ~300 items, a carousel becomes unusable — if data grows
  // past this, consider replacing the carousel with a search/filter UI instead.
  const mostlyExhaustiveWhitelistTokenFetch = async () => {
    const firstPage = await whitelistService.getListTokens({
      page: 1,
      limit: limit, // 100 items per page
      active: "true",
      isDropped: "false",
      chainIds: convertArrayToStringParam({
        array: NETWORK_CONFIGS.map((config) => config.backendChainId),
      })
    });

    const totalPages = Math.ceil(firstPage.total / limit);

    // Cap at 3 pages (300 tokens). This is a deliberate product limit, not just
    // a safety net — if the API returns more, we intentionally ignore the rest.
    const maxPages = 3;

    // Subtract 1 from both because page 1 is already fetched above.
    // e.g. totalPages=3 → pagesToFetch=2 → Promise.all fetches pages 2 and 3.
    const pagesToFetch = Math.min(totalPages - 1, maxPages - 1);

    const rest = await Promise.all(
      Array.from({ length: pagesToFetch }, (_, i) =>
        whitelistService.getListTokens({
          page: i + 2, // starts at page 2 since page 1 is already fetched
          limit: limit,
          active: "true",
          isDropped: "false",
          chainIds: convertArrayToStringParam({
            array: NETWORK_CONFIGS.map((config) => config.backendChainId),
          })
        }),
      ),
    );

    return [
      ...firstPage.whitelistTokens,
      ...rest.flatMap((page) => page.whitelistTokens),
    ];
  };

  const { data: tokenList, isPending: isPendingTokens } = useQuery({
    queryKey: whitelistQueryKeys.listTokens({
      mostlyExhaustive: true,
    }),
    queryFn: mostlyExhaustiveWhitelistTokenFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // The number of tokens for a full loop
  const MIN_TO_LOOP = 13;
  const displayTokens = tokenList;

  return (
    <GlowContainer
      variant={variant}
      className="flex items-center gap-3 px-2.5 py-2.25 xl:gap-12 xl:px-5 xl:py-4.5"
    >
      <div className="flex w-30 shrink-0 items-center gap-1.75 xl:w-56.75 xl:gap-3.25">
        <IconTokenList className="shrink-0" />
        <div className="text-center text-md font-medium xl:shrink-0 xl:text-2xl">
          TOKENS LIST
        </div>
      </div>

      <Carousel
        className="h-10 w-[calc(100%-var(--spacing)*35.5)] xl:h-15 xl:w-[calc(100%-var(--spacing)*73.75)]"
        opts={{
          align: "start",
          loop: true,
        }}
      >
        {/* 
          desktop: 15 + 4.75
          mobile: 10 + 2.25
         */}
        <CarouselContent
          containerClassName="mx-12.25 xl:mx-19.75"
          className="ml-0"
        >
          {displayTokens?.map((token, index) => {
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
              <CarouselItem
                className="ml-2.25 size-10 shrink-0 basis-auto pl-0 xl:ml-4.75 xl:size-15"
                key={`${token.address}-${index}`}
              >
                <button
                  key={token.address}
                  title={token.address}
                  onClick={() => onTokenClick?.(token)}
                  className="size-10 shrink-0 xl:size-15"
                >
                  <TokenImage
                    src={tokenDisplay.imageUri}
                    alt={tokenDisplay.name}
                    classNames={{
                      common: "size-10 xl:size-15",
                    }}
                  />
                </button>
              </CarouselItem>
            );
          })}
          {isPendingTokens &&
            Array.from({ length: MIN_TO_LOOP }, (_, i) => (
              <CarouselItem
                key={i}
                className="ml-2.25 size-10 shrink-0 basis-auto pl-0 xl:ml-4.75 xl:size-15"
              >
                <TokenImage
                  isLoading
                  classNames={{
                    common: "size-10 xl:size-15",
                  }}
                />
              </CarouselItem>
            ))}
        </CarouselContent>
        <CarouselPrevious className={cn("left-0", buttonClassName)} />
        <CarouselNext className={cn("right-0", buttonClassName)} />
      </Carousel>
    </GlowContainer>
  );
};

export default TokenListGlow;
