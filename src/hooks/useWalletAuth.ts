import { useState, useCallback } from 'react'
import { useSignMessage, useConnections } from 'wagmi'
import { useAppKitAccount, useDisconnect } from '@reown/appkit/react'
import { createWalletClient, custom } from 'viem'
import bs58 from 'bs58'
import { authService, hasEnabledAdminRole } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'
import { getErrorMessage } from '@/utils/helpers/error-message'
import { toast } from '@/components/common/custom-toast'
import { useNavigate } from '@tanstack/react-router'

type WalletType = 'evm' | 'solana'

/** Decodes any error into readable console output, including axios HTTP responses. */
function logError(err: any) {
  if (!err) return
  const isAxios = !!err.isAxiosError || !!err.response
  console.error('  name   :', err.name ?? '(none)')
  console.error('  message:', err.message ?? '(none)')
  if (isAxios) {
    console.error('  HTTP status :', err.response?.status)
    console.error('  HTTP data   :', err.response?.data)
    console.error('  HTTP headers:', err.response?.headers)
    console.error('  request URL :', err.config?.url)
    console.error('  request body:', err.config?.data)
  }
  if (err.cause) console.error('  cause  :', err.cause)
  console.error('  stack  :', err.stack)
}

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
  const navigate = useNavigate()

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
      console.group(`[useWalletAuth] authenticate — ${walletType}`)
      console.log('  address:', address, '| chainId:', chainId)
      console.log('  connector:', connector?.id ?? '(none)', '| connections:', connections.length)
      try {
        setIsAuthenticating(true)
        setLoading(true)
        setError(null)

        // ── Step 1: request nonce message ─────────────────────────────────
        console.log('[Step 1] requestSigningMessage…')
        let response: Awaited<ReturnType<typeof authService.requestSigningMessage>>
        try {
          response = await authService.requestSigningMessage({ address, chainId })
          console.log('[Step 1] ✓ response:', response)
        } catch (err: any) {
          console.error('[Step 1] ✗ requestSigningMessage failed')
          logError(err)
          throw err
        }

        const message = response.message
        if (!message) throw new Error('Invalid response: message is missing')

        // ── Step 2: sign message ──────────────────────────────────────────
        let signature: string

        if (walletType === 'evm') {
          console.log('[Step 2] signing EVM message…')
          try {
            signature = await signEvmMessage({ message })
            console.log('[Step 2] ✓ wagmi signEvmMessage OK, sig:', signature?.slice(0, 20), '…')
          } catch (signError: any) {
            console.warn('[Step 2] wagmi signEvmMessage failed — falling back to viem provider')
            logError(signError)
            // wagmi v3 throws ConnectorChainMismatchError even when both chain IDs are
            // numerically equal — the comparison fails due to a number vs bigint type
            // mismatch in wagmi internals. connector.getWalletClient() shares the same
            // validation path, so it fails too.
            // Fix: create a viem WalletClient directly from the raw EIP-1193 provider.
            // viem's signMessage calls personal_sign without any chain ID checks.
            if (!connector) throw signError
            console.log('[Step 2] connector.id:', connector.id)
            const liveChainId = Number(await connector.getChainId())
            console.log('[Step 2] liveChainId:', liveChainId)
            const provider = await connector.getProvider({ chainId: liveChainId }) as any
            console.log('[Step 2] provider type:', provider?.constructor?.name ?? typeof provider)
            const viemClient = createWalletClient({ transport: custom(provider) })
            try {
              signature = await viemClient.signMessage({ account: address as `0x${string}`, message })
              console.log('[Step 2] ✓ viem signMessage OK, sig:', signature?.slice(0, 20), '…')
            } catch (viemErr: any) {
              console.error('[Step 2] ✗ viem signMessage also failed')
              logError(viemErr)
              throw viemErr
            }
          }
        } else {
          console.log('[Step 2] signing Solana message…')
          try {
            signature = await signSolanaMessage(message)
            console.log('[Step 2] ✓ Solana signMessage OK')
          } catch (solErr: any) {
            console.error('[Step 2] ✗ Solana signMessage failed')
            logError(solErr)
            throw solErr
          }
        }

        // ── Step 3: sign-in API call ──────────────────────────────────────
        const signInMethod = walletType === 'evm' ? authService.signInEvm : authService.signInSolana
        console.log('[Step 3] signIn API call…', { address, chainId, sigPrefix: signature.slice(0, 20) })
        let token: string
        try {
          const result = await signInMethod({ address, message, signature, chainId })
          token = result.token
          console.log('[Step 3] ✓ token received:', token?.slice(0, 20), '…')
        } catch (err: any) {
          console.error('[Step 3] ✗ signIn API failed')
          logError(err)
          throw err
        }

        // ── Step 4: store temp login & fetch user ─────────────────────────
        console.log('[Step 4] storing temp token and fetching user info…')
        login({ user: { id: '', address, chainId }, accessToken: token })

        let userInfo: Awaited<ReturnType<typeof authService.getCurrentUser>>
        try {
          userInfo = await authService.getCurrentUser()
          console.log('[Step 4] ✓ userInfo:', userInfo)
        } catch (err: any) {
          console.error('[Step 4] ✗ getCurrentUser failed')
          logError(err)
          throw err
        }

        // ── Step 5: admin role check ──────────────────────────────────────
        console.log('[Step 5] checking admin role, role:', userInfo.role)
        if (!hasEnabledAdminRole(userInfo)) {
          await disconnect()
          logout()
          const errorMessage = 'Access Denied: This wallet does not have administrative privileges.'
          toast.error(errorMessage)
          navigate({ to: '/' })
          throw new Error(errorMessage)
        }

        login({
          user: { id: userInfo.id, address: userInfo.address || address, role: userInfo.role, chainId },
          accessToken: token,
        })
        console.log('[Step 5] ✓ authentication complete')
        console.groupEnd()
        return { success: true }
      } catch (error: any) {
        const errorMessage = getErrorMessage({
          error,
          fallbackMsg: 'Authentication failed. Please try again.',
        })
        setError(errorMessage)
        console.error('[useWalletAuth] ✗ authenticate threw — final error message:', errorMessage)
        logError(error)
        console.groupEnd()
        return { success: false, error: errorMessage }
      } finally {
        setIsAuthenticating(false)
        setLoading(false)
      }
    },
    [signEvmMessage, connector, connections.length, login, logout, setLoading, setError, disconnect, navigate],
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
