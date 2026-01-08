import { useState } from 'react'
import { AppKitButton } from '@reown/appkit/react'
import { useAppKitWallet } from '@reown/appkit-wallet-button/react'
import { useWalletAuth } from '@/hooks/useWalletAuth'
import { useAuthStore } from '@/store/authStore'

export function ConnectWalletButtons() {
  const { user, error, logout } = useAuthStore()
  const { authenticateEvm, authenticateSolana, isAuthenticating } =
    useWalletAuth()
  const [evmConnecting, setEvmConnecting] = useState(false)
  const [solanaConnecting, setSolanaConnecting] = useState(false)

  const {
    connect: connectEvm,
    isReady: isReadyEvm,
    isPending: isPendingEvm,
  } = useAppKitWallet({
    namespace: 'eip155',
    onSuccess: async (caipAddress) => {
      // Extract address from ParsedCaipAddress
      console.log('EVM wallet connected, caipAddress:', caipAddress)
      console.log('caipAddress type:', typeof caipAddress)
      console.log('caipAddress keys:', caipAddress && typeof caipAddress === 'object' ? Object.keys(caipAddress) : 'N/A')
      
      // Handle different caipAddress formats
      let address: string
      if (typeof caipAddress === 'string') {
        address = caipAddress
      } else if (caipAddress && typeof caipAddress === 'object') {
        // Try different possible properties
        address = (caipAddress as any).address || (caipAddress as any).accountId || (caipAddress as any).account || ''
      } else {
        console.error('Invalid caipAddress format:', caipAddress)
        setEvmConnecting(false)
        return
      }
      
      if (!address) {
        console.error('Could not extract address from caipAddress:', caipAddress)
        setEvmConnecting(false)
        return
      }
      
      console.info('Connected EVM wallet, extracted address:', address)
      setEvmConnecting(false)
      // Automatically trigger authentication after wallet connection
      // Pass address directly to avoid timing issues with hooks
      try {
        console.log('Calling authenticateEvm with address:', address)
        await authenticateEvm(address)
      } catch (error) {
        console.error('EVM authentication error:', error)
      }
    },
    onError: (error) => {
      console.error('EVM connect error:', error)
      setEvmConnecting(false)
    },
  })

  const {
    connect: connectSolana,
    isReady: isReadySol,
    isPending: isPendingSol,
  } = useAppKitWallet({
    namespace: 'solana',
    onSuccess: async (caipAddress) => {
      // Extract address from ParsedCaipAddress
      const address = typeof caipAddress === 'string' ? caipAddress : caipAddress.address
      console.info('Connected Solana wallet:', address)
      setSolanaConnecting(false)
      // Automatically trigger authentication after wallet connection
      // Pass address directly to avoid timing issues with hooks
      try {
        await authenticateSolana(address)
      } catch (error) {
        console.error('Solana authentication error:', error)
      }
    },
    onError: (error) => {
      console.error('Solana connect error:', error)
      setSolanaConnecting(false)
    },
  })

  const handleConnectEvm = async () => {
    setEvmConnecting(true)
    connectEvm('metamask')
  }

  const handleConnectSolana = async () => {
    setSolanaConnecting(true)
    connectSolana('phantom')
  }

  const isConnecting = isPendingEvm || isPendingSol || evmConnecting || solanaConnecting

  if (user) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded border border-green-500 bg-green-50 p-4">
          <p className="font-semibold text-green-800">
            ✅ Đã đăng nhập thành công!
          </p>
          <p className="mt-1 text-sm text-green-700">
            User ID: {user.id}
            {user.address && (
              <>
                <br />
                Address: {user.address}
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded border border-red-500 bg-red-50 px-3 py-2 text-red-700 hover:bg-red-100"
        >
          Đăng xuất
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleConnectEvm}
          disabled={!isReadyEvm || isConnecting}
          className="rounded border px-3 py-2 hover:bg-neutral-100 disabled:opacity-50"
        >
          {isPendingEvm || evmConnecting
            ? 'Connecting...'
            : isAuthenticating
              ? 'Authenticating...'
              : 'Connect MetaMask (EVM)'}
        </button>
        <button
          type="button"
          onClick={handleConnectSolana}
          disabled={!isReadySol || isConnecting}
          className="rounded border px-3 py-2 hover:bg-neutral-100 disabled:opacity-50"
        >
          {isPendingSol || solanaConnecting
            ? 'Connecting...'
            : isAuthenticating
              ? 'Authenticating...'
              : 'Connect Phantom (Solana)'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <AppKitButton />
        <span className="text-sm text-gray-600">
          or use the AppKit modal to pick a wallet / network
        </span>
      </div>

      {isAuthenticating && (
        <div className="rounded border border-blue-500 bg-blue-50 p-3">
          <p className="text-sm text-blue-800">
            Đang xác thực với ví của bạn...
          </p>
        </div>
      )}

      {error && (
        <div className="rounded border border-red-500 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-800">Lỗi:</p>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}

