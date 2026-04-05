import { apiClient } from "@/config/axios";
import { API_ROUTES } from "@/services/apiRoutes";
const USERS_API_ROUTES = API_ROUTES.USERS;

export interface RequestSigningMessageParams {
  address: string;
  chainId?: string;
}

export interface RequestSigningMessageResponse {
  message: string;
}

export interface SignInParams {
  address: string;
  message: string;
  signature: string;
  chainId?: string;
}

export interface SignInResponse {
  token: string;
}

export type UserRole = "normal" | "admin" | "super_admin";

export interface UserResponse {
  id: string;
  address: string;
  role: UserRole;
  avatar: string | null;
  name: string | null; // nickname
}

export interface UpdatePersonalInfoRequest {
  name?: string | null;
  avatar?: File;
}

export interface UpdatePersonalInfoResponse {
  name?: string;
  avatar?: string;
}

export const resolveUserRole = (
  user?: Pick<UserResponse, "role"> | null,
): UserRole | null => user?.role ?? null;

export const hasEnabledAdminRole = (
  user?: Pick<UserResponse, "role"> | null,
) => {
  const role = resolveUserRole(user);

  return role === "admin" || role === "super_admin";
};

export const isSuperAdminRole = (
  user?: Pick<UserResponse, "role"> | null,
) => hasEnabledAdminRole(user) && resolveUserRole(user) === "super_admin";

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

  updatePersonalInfo: async (request: UpdatePersonalInfoRequest) => {
    const formData = new FormData();
    if (request.avatar) {
      formData.append("avatar", request.avatar);
    }
    if (request.name) {
      formData.append("name", request.name);
    }

    const response = await apiClient.post<UpdatePersonalInfoResponse>(
      USERS_API_ROUTES.UPDATE_PROFILE,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response;
  },
};
