import { useQuery } from "@tanstack/react-query";
import { whitelistService } from "../whitelistService";
import { whitelistUserService } from "../whitelistUserService";
import { whitelistQueryKeys, whitelistUserQueryKeys } from "./queryKey";

export const useGetWhitelistTokens = () => {
    return useQuery({
        queryKey: whitelistQueryKeys.listTokens(),
        queryFn: () => whitelistService.getListTokens(),
        staleTime: 1000 * 60 * 60 * 1,
    });
};

export const useGetWhitelistUsers = (search?: string) => {
    return useQuery({
        queryKey: whitelistUserQueryKeys.listUsers(search),
        queryFn: () => whitelistUserService.getListUsers({ search }),
        staleTime: 1000 * 60 * 5,
    });
};
