import { useQuery } from "@tanstack/react-query";
import { whitelistService, type ListTokensRequest } from "../whitelistService";
import { whitelistQueryKeys } from "./queryKey";

export const useGetWhitelistTokens = (params?: ListTokensRequest) => {
  return useQuery({
    queryKey: whitelistQueryKeys.listTokens(params),
    queryFn: () => whitelistService.getListTokens(params),
    staleTime: 1000 * 60 * 60 * 1,
  });
};
