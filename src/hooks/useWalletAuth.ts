import { useState, useCallback } from 'react'
import { useSignMessage, useConnections } from 'wagmi'
import { useAppKitAccount } from '@reown/appkit/react'
import bs58 from 'bs58'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'
import { getErrorMessage } from '@/utils/helpers/error-message'

type WalletType = 'evm' | 'solana'

async function signSolanaMessage(message: string): Promise<string> {
  const solanaWallet = window.solana

  if (!solanaWallet) {
    throw new Error('Solana wallet not found. Please install Phantom wallet.')
  }

  if (!solanaWallet.isConnected) {
    await solanaWallet.connect()
  }

  const messageBytes = new TextEncoder().encode(message)
  const signedMessage = await solanaWallet.signMessage(messageBytes, 'utf8')

  // Solana wallets return a Uint8Array signature; encode to base58 per the standard.
  const signature = bs58.encode(signedMessage.signature)

  return signature
}

export function useWalletAuth() {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const { login, setLoading, setError, user } = useAuthStore()

  const { address: evmAddress } = useAppKitAccount({
    namespace: 'eip155',
  })
  const { mutateAsync: signEvmMessage } = useSignMessage()
  const connections = useConnections()
  const connector = connections[0]?.connector

  const { address: solanaAddress } = useAppKitAccount({
    namespace: 'solana',
  })

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

        const message = response.message
        if (!message) {
          throw new Error('Invalid response: message is missing')
        }

        let signature: string

        if (walletType === 'evm') {
          try {
            signature = await signEvmMessage({ message })
          } catch (signError: any) {
            // wagmi's signEvmMessage can fail with ConnectorChainMismatchError when the
            // wagmi-internal chain ID doesn't match the connector's active chain, or with
            // WalletConnect session errors on mobile. Fall back to a raw personal_sign
            // via the connector's underlying provider, which bypasses wagmi's chain
            // validation entirely and works across all EVM wallet types.
            if (!connector) throw signError

            let provider: any
            try {
              provider = await connector.getProvider()
            } catch {
              throw signError
            }

            // Encode message as hex for personal_sign (EIP-191).
            const msgHex = '0x' + Array.from(
              new TextEncoder().encode(message),
              (b) => b.toString(16).padStart(2, '0'),
            ).join('')

            // Race against a timeout so a dead WalletConnect relay doesn't hang
            // the auth flow indefinitely and leave isAuthenticating stuck as true.
            const timeoutMs = 60_000
            try {
              signature = await Promise.race([
                provider.request({
                  method: 'personal_sign',
                  params: [msgHex, address],
                }),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error(`personal_sign timed out after ${timeoutMs / 1000}s`)), timeoutMs)
                ),
              ]) as string
            } catch (psErr: any) {
              throw psErr
            }
          }
        } else {
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

        // Store a temporary session immediately so protected queries can start;
        // then overwrite with the full user profile from the next request.
        const tempToken = token
        login({
          user: { id: '', address, chainId },
          accessToken: tempToken,
        })

        const userInfo = await authService.getCurrentUser()

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
        // Do NOT call setError here. useWalletConnectionHandler owns error display
        // and checks the auth generation before showing a toast, so stale auth
        // failures (e.g. a previous WC session timing out) are silently discarded.
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
