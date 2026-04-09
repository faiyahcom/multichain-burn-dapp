import { useState, useCallback } from 'react'
import { useSignMessage, useConnections } from 'wagmi'
import { useAppKitAccount, useDisconnect } from '@reown/appkit/react'
import bs58 from 'bs58'
import { authService, hasEnabledAdminRole } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'
import { getErrorMessage } from '@/utils/helpers/error-message'
import { toast } from '@/components/common/custom-toast'

type WalletType = 'evm' | 'solana'

// Helper function to sign message with Solana wallet
async function signSolanaMessage(
  message: string,
): Promise<string> {
  // Check if Solana wallet is available (Phantom, etc.)
  const solanaWallet = window.solana

  if (!solanaWallet) {
    throw new Error('Solana wallet not found. Please install Phantom wallet.')
  }

  // Ensure wallet is connected
  if (!solanaWallet.isConnected) {
    await solanaWallet.connect()
  }

  // Convert message to Uint8Array
  const messageBytes = new TextEncoder().encode(message)

  // Sign message - Phantom and other Solana wallets use signMessage method
  const signedMessage = await solanaWallet.signMessage(messageBytes, 'utf8')

  // Convert signature to base58 string (Solana standard)
  // The signature is already a Uint8Array from signMessage
  const signature = bs58.encode(signedMessage.signature)

  return signature
}

export function useWalletAuth() {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const { login, setLoading, setError, logout } = useAuthStore()

  const { address: evmAddress } = useAppKitAccount({
    namespace: 'eip155',
  })
  const { mutateAsync: signEvmMessage } = useSignMessage()
  const connections = useConnections()
  const connector = connections[0]?.connector

  const { address: solanaAddress } = useAppKitAccount({
    namespace: 'solana',
  })
  const { disconnect } = useDisconnect();

  const authenticate = useCallback(
    async (walletType: WalletType, address: string, chainId?: string) => {
      try {
        setIsAuthenticating(true)
        setLoading(true)
        setError(null)

        const response = await authService.requestSigningMessage({
          address,
          chainId,
        })

        // Extract message from response
        // Response format: { "message": "1767860919362, Welcome" }
        const message = response.message
        if (!message) {
          throw new Error('Invalid response: message is missing')
        }

        let signature: string

        if (walletType === 'evm') {
          try {
            signature = await signEvmMessage({ message })
          } catch (signError: any) {
            console.log('signEvmMessage failed, trying personal_sign fallback:', signError?.name, signError?.message)
            // Fall back to raw personal_sign via the connector's provider.
            // Handles ConnectorChainMismatchError (wagmi type/value chain ID mismatch),
            // WalletConnect session errors, and mobile wallet signing failures.
            if (!connector) {
              throw signError
            }
            const provider = await connector.getProvider() as any
            const msgHex = '0x' + Array.from(
              new TextEncoder().encode(message),
              (b) => b.toString(16).padStart(2, '0'),
            ).join('')
            signature = await provider.request({
              method: 'personal_sign',
              params: [msgHex, address],
            })
          }
        } else {
          // Sign with Solana wallet
          console.log('Signing message with Solana wallet:', message)
          signature = await signSolanaMessage(message)
        }

        const signInMethod =
          walletType === 'evm'
            ? authService.signInEvm
            : authService.signInSolana

        const { token } = await signInMethod({
          address,
          message,
          signature,
          chainId,
        })
        console.log('Authentication successful, token received')

        const tempToken = token
        console.log('Temporary token:', tempToken)
        login({
          user: { id: '', address, chainId }, // Temporary, will be updated below
          accessToken: tempToken,
        })

        const userInfo = await authService.getCurrentUser()
        console.log('User info received:', userInfo)

        // For admin branch only, check if user is admin
        if (!hasEnabledAdminRole(userInfo)) {
          await disconnect()
          logout()
          const errorMessage = "Access Denied: This wallet does not have administrative privileges."
          toast.error(errorMessage)
          throw new Error(errorMessage)
        }

        login({
          user: { id: userInfo.id, address: userInfo.address || address, role: userInfo.role, chainId },
          accessToken: tempToken,
        })

        return { success: true }
      } catch (error: any) {
        const errorMessage = getErrorMessage({
          error,
          fallbackMsg: 'Authentication failed. Please try again.',
        })
        setError(errorMessage)
        console.error('Authentication error:', error)
        return { success: false, error: errorMessage }
      } finally {
        setIsAuthenticating(false)
        setLoading(false)
      }
    },
    [signEvmMessage, connector, login, setLoading, setError],
  )

  const authenticateEvm = useCallback(
    async (address?: string, chainId?: string) => {
      const targetAddress = address || evmAddress
      if (!targetAddress) {
        throw new Error('EVM wallet not connected')
      }
      return authenticate('evm', targetAddress, chainId)
    },
    [evmAddress, authenticate],
  )

  const authenticateSolana = useCallback(
    async (address?: string, chainId?: string) => {
      const targetAddress = address || solanaAddress
      if (!targetAddress) {
        throw new Error('Solana wallet not connected')
      }
      return authenticate('solana', targetAddress, chainId)
    },
    [solanaAddress, authenticate],
  )

  return {
    authenticateEvm,
    authenticateSolana,
    isAuthenticating,
    evmAddress,
    solanaAddress,
  }
}
