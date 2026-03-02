import { apiClient } from "@/config/axios";
import { API_ROUTES } from "@/services/apiRoutes";
const WHITELIST_API_ROUTES = API_ROUTES.WHITELIST;

export interface WhitelistToken {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    enable: boolean;
    chainId: string;
    imageUri: string;
    customName: string;
    customSymbol: string;
    description: string;
    homepage: string;
    whitepaper: string;
}

export interface ListTokensResponse {
    whitelistTokens: WhitelistToken[];
}

export const whitelistService = {
    getListTokens: async () => {
        const response = await apiClient.get<ListTokensResponse>(
            `${WHITELIST_API_ROUTES.GET_LIST_TOKENS}`, {
            params: {
                page: 1,
                limit: 100,
            }
        }
        );
        return response;
    },
};