import { apiClient } from "@/config/axios";
import { API_ROUTES } from "@/services/apiRoutes";
import type { GetNativePricesResponse } from "@/types/general";

export const generalService = {
  getNativePrices: async (): Promise<GetNativePricesResponse> => {
    const response = await apiClient.get<GetNativePricesResponse>(
      API_ROUTES.GENERAL.NATIVE_PRICES,
    );
    return response;
  },
};
