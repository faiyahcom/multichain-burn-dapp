import { useQuery } from "@tanstack/react-query";
import { generalService } from "@/services/generalService";
import { generalQueryKeys } from "@/services/queries/queryKey";
import type { GetNativePricesResponse } from "@/types/general";

export function useNativePrices() {
  return useQuery<GetNativePricesResponse>({
    queryKey: generalQueryKeys.nativePrices(),
    queryFn: () => generalService.getNativePrices(),
    staleTime: 5 * 60 * 1000, // cache prices for 5 minutes
  });
}
