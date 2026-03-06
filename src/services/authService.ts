import { apiClient } from "@/config/axios";
import { API_ROUTES } from "@/services/apiRoutes";
const USERS_API_ROUTES = API_ROUTES.USERS;

export interface RequestSigningMessageParams {
  address: string;
}

export interface RequestSigningMessageResponse {
  message: string;
}

export interface SignInParams {
  address: string;
  message: string;
  signature: string;
}

export interface SignInResponse {
  token: string;
}

export interface UserResponse {
  id: string;
  address: string;
}

export const authService = {
  requestSigningMessage: async (
    params: RequestSigningMessageParams,
  ): Promise<RequestSigningMessageResponse> => {
    const response = await apiClient.post<RequestSigningMessageResponse>(
      USERS_API_ROUTES.REQUEST_SIGNING_MESSAGE,
      params,
    );
    return response;
  },

  signInEvm: async (params: SignInParams): Promise<SignInResponse> => {
    const response = await apiClient.post<SignInResponse>(
      USERS_API_ROUTES.SIGN_IN_EVM,
      params,
    );
    return response;
  },

  signInSolana: async (params: SignInParams): Promise<SignInResponse> => {
    const response = await apiClient.post<SignInResponse>(
      USERS_API_ROUTES.SIGN_IN_SOLANA,
      params,
    );
    return response;
  },

  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>(
      USERS_API_ROUTES.GET_CURRENT_USER,
    );
    return response;
  },
};
