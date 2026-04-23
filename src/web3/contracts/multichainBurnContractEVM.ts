import { ethers, type Signer } from "ethers";
import MULTICHAIN_BURN_ABI_SWAP_FACTORY from "./abis/abi_evm_swap_factory.json";
import MULTICHAIN_BURN_ABI_SWAP_ROUTER from "./abis/abi_evm_swap_router.json";
import MULTICHAIN_BURN_ABI_BURN_FACTORY from "./abis/abi_evm_burn_factory.json";
import MULTICHAIN_BURN_ABI_BURN_ROUTER from "./abis/abi_evm_burn_router.json";
import MULTICHAIN_BURN_ABI_ACCESS_MANAGER from "./abis/abi_evm_access_manager.json";
import MULTICHAIN_STAKE_ABI_FACTORY from "./abis/abi_evm_stake_factory.json";
import { useSystemStore } from "@/stores/systemStore";

import {
  MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_SWAP_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_EVM_ROUTER_SWAP_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_BURN_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_EVM_ROUTER_BURN_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_EVM_ACCESS_MANAGER_SWAP_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_XPHERE_FACTORY_BURN_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_XPHERE_ROUTER_BURN_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_XPHERE_FACTORY_SWAP_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_XPHERE_ROUTER_SWAP_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_XPHERE_ACCESS_MANAGER_SWAP_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_BSC_FACTORY_BURN_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_BSC_ROUTER_BURN_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_BSC_FACTORY_SWAP_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_BSC_ROUTER_SWAP_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_BSC_ACCESS_MANAGER_SWAP_ADDRESS,
  MULTICHAIN_STAKE_PROGRAM_EVM_FACTORY_ADDRESS,
  MULTICHAIN_STAKE_PROGRAM_BSC_FACTORY_ADDRESS,
  MULTICHAIN_STAKE_PROGRAM_XPHERE_FACTORY_ADDRESS,
} from "@/web3";

export const EVM_POOL_TYPES = {
  BURN: 0,
  SWAP: 1,
  STAKE: 2,
  LAUNCHPAD: 3,
} as const;

export const getContractSwapFactory = (signer: Signer) => {
  const networkId = useSystemStore.getState().selectedNetworkId;
  let address: string;
  switch (networkId) {
    case "xphere":
      address = MULTICHAIN_BURN_PROGRAM_XPHERE_FACTORY_SWAP_ADDRESS;
      break;
    case "binance":
      address = MULTICHAIN_BURN_PROGRAM_BSC_FACTORY_SWAP_ADDRESS;
      break;
    default:
      address = MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_SWAP_ADDRESS;
  }
  console.log("[getContractSwapFactory] address:", address);
  return new ethers.Contract(address, MULTICHAIN_BURN_ABI_SWAP_FACTORY, signer);
};

export const getContractSwapRouter = (signer: Signer) => {
  const networkId = useSystemStore.getState().selectedNetworkId;
  let address: string;
  switch (networkId) {
    case "xphere":
      address = MULTICHAIN_BURN_PROGRAM_XPHERE_ROUTER_SWAP_ADDRESS;
      break;
    case "binance":
      address = MULTICHAIN_BURN_PROGRAM_BSC_ROUTER_SWAP_ADDRESS;
      break;
    default:
      address = MULTICHAIN_BURN_PROGRAM_EVM_ROUTER_SWAP_ADDRESS;
  }
  console.log("[getContractSwapRouter] address:", address);
  return new ethers.Contract(address, MULTICHAIN_BURN_ABI_SWAP_ROUTER, signer);
};

export const getContractBurnFactory = (signer: Signer) => {
  const networkId = useSystemStore.getState().selectedNetworkId;
  let rawAddress: string;
  switch (networkId) {
    case "xphere":
      rawAddress = MULTICHAIN_BURN_PROGRAM_XPHERE_FACTORY_BURN_ADDRESS;
      break;
    case "binance":
      rawAddress = MULTICHAIN_BURN_PROGRAM_BSC_FACTORY_BURN_ADDRESS;
      break;
    default:
      rawAddress = MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_BURN_ADDRESS;
  }
  const address = ethers.getAddress(rawAddress.toLowerCase());
  console.log("[getContractBurnFactory] address:", address);
  return new ethers.Contract(address, MULTICHAIN_BURN_ABI_BURN_FACTORY, signer);
};

export const getContractBurnRouter = (signer: Signer) => {
  const networkId = useSystemStore.getState().selectedNetworkId;
  let address: string;
  switch (networkId) {
    case "xphere":
      address = MULTICHAIN_BURN_PROGRAM_XPHERE_ROUTER_BURN_ADDRESS;
      break;
    case "binance":
      address = MULTICHAIN_BURN_PROGRAM_BSC_ROUTER_BURN_ADDRESS;
      break;
    default:
      address = MULTICHAIN_BURN_PROGRAM_EVM_ROUTER_BURN_ADDRESS;
  }
  console.log("[getContractBurnRouter] address:", address);
  return new ethers.Contract(address, MULTICHAIN_BURN_ABI_BURN_ROUTER, signer);
};

export const getContractStakeFactory = (signer: Signer) => {
  const networkId = useSystemStore.getState().selectedNetworkId;
  let address: string;
  switch (networkId) {
    case "xphere":
      address = MULTICHAIN_STAKE_PROGRAM_XPHERE_FACTORY_ADDRESS;
      break;
    case "binance":
      address = MULTICHAIN_STAKE_PROGRAM_BSC_FACTORY_ADDRESS;
      break;
    default:
      address = MULTICHAIN_STAKE_PROGRAM_EVM_FACTORY_ADDRESS;
  }
  console.log("[getContractStakeFactory] address:", address);
  return new ethers.Contract(address, MULTICHAIN_STAKE_ABI_FACTORY, signer);
};

export const getContractAccessManager = (signer: Signer) => {
  const networkId = useSystemStore.getState().selectedNetworkId;
  let address: string;
  switch (networkId) {
    case "xphere":
      address = MULTICHAIN_BURN_PROGRAM_XPHERE_ACCESS_MANAGER_SWAP_ADDRESS;
      break;
    case "binance":
      address = MULTICHAIN_BURN_PROGRAM_BSC_ACCESS_MANAGER_SWAP_ADDRESS;
      break;
    default:
      address = MULTICHAIN_BURN_PROGRAM_EVM_ACCESS_MANAGER_SWAP_ADDRESS;
  }
  console.log("[getContractAccessManager] address:", address);
  return new ethers.Contract(
    address,
    MULTICHAIN_BURN_ABI_ACCESS_MANAGER,
    signer,
  );
};

export const getContractBurnFactoryInterface = () => {
  return new ethers.Interface(MULTICHAIN_BURN_ABI_BURN_FACTORY);
};

export const getContractBurnRouterInterface = () => {
  return new ethers.Interface(MULTICHAIN_BURN_ABI_BURN_ROUTER);
};

export const getContractSwapFactoryInterface = () => {
  return new ethers.Interface(MULTICHAIN_BURN_ABI_SWAP_FACTORY);
};

export const getContractSwapRouterInterface = () => {
  return new ethers.Interface(MULTICHAIN_BURN_ABI_SWAP_ROUTER);
};

export const getContractStakeFactoryInterface = () => {
  return new ethers.Interface(MULTICHAIN_STAKE_ABI_FACTORY);
};

export const getContractAccessManagerInterface = () => {
  return new ethers.Interface(MULTICHAIN_BURN_ABI_ACCESS_MANAGER);
};

export const getERC20Contract = (token: string, signer: Signer) => {
  return new ethers.Contract(
    token,
    [
      "function totalSupply() view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function balanceOf(address owner) view returns (uint256)",
      "function allowance(address owner, address spender) view returns (uint256)",
      "function approve(address spender, uint256 amount) external returns (bool)",
    ],
    signer,
  );
};
