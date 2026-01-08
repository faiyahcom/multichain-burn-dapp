import { apiClient } from '@/config/axios'

export interface RequestSigningMessageParams {
  address: string
}

export interface RequestSigningMessageResponse {
  message: string
}

export interface SignInParams {
  address: string
  message: string
  signature: string
}

export interface SignInResponse {
  token: string
}

export interface UserResponse {
  id: string
  address: string
}

export const authService = {
  // Request signing message from server
  requestSigningMessage: async (
    params: RequestSigningMessageParams,
  ): Promise<RequestSigningMessageResponse> => {
    const response = await apiClient.post<RequestSigningMessageResponse>(
      '/users/req-signing-message',
      params,
    )
    return response
  },

  // Sign in with EVM wallet
  signInEvm: async (params: SignInParams): Promise<SignInResponse> => {
    const response = await apiClient.post<SignInResponse>(
      '/users/evm/sign-in',
      params,
    )
    return response
  },

  // Sign in with Solana wallet
  signInSolana: async (params: SignInParams): Promise<SignInResponse> => {
    const response = await apiClient.post<SignInResponse>(
      '/users/solana/sign-in',
      params,
    )
    return response
  },

  // Get current user info
  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>('/users/me')
    return response
  },
}
