import { useQuery } from "@tanstack/react-query";
import { whitelistService, type ListTokensRequest } from "../whitelistService";
import { whitelistUserService } from "../whitelistUserService";
import { whitelistQueryKeys, whitelistUserQueryKeys } from "./queryKey";

export const useGetWhitelistTokens = (params?: ListTokensRequest) => {
  return useQuery({
    queryKey: whitelistQueryKeys.listTokens(params as Record<string, unknown>),
    queryFn: () => whitelistService.getListTokens(params),
    staleTime: 1000 * 60 * 60 * 1,
  });
};

export const useGetWhitelistUsers = (params?: {
  search?: string;
  chainIds?: number[];
  tokenAddresses?: string[];
}) => {
  return useQuery({
    queryKey: whitelistUserQueryKeys.listUsers(params),
    queryFn: () => whitelistUserService.getListUsers(params),
    staleTime: 1000 * 60 * 5,
  });
};
