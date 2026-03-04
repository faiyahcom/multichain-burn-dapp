import { useQuery } from "@tanstack/react-query";
import { whitelistService } from "../whitelistService";
import { whitelistQueryKeys } from "./queryKey";

export const useGetWhitelistTokens = () => {
  return useQuery({
    queryKey: whitelistQueryKeys.listTokens(),
    queryFn: () => whitelistService.getListTokens(),
    staleTime: 1000 * 60 * 60 * 1,
  });
};
