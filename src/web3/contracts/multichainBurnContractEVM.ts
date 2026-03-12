import { ethers, type Signer } from "ethers";
import MULTICHAIN_BURN_ABI_SWAP_FACTORY from "./abis/abi_evm_swap_factory.json";
import MULTICHAIN_BURN_ABI_SWAP_ROUTER from "./abis/abi_evm_swap_router.json";
import MULTICHAIN_BURN_ABI_BURN_FACTORY from "./abis/abi_evm_burn_factory.json";
import MULTICHAIN_BURN_ABI_BURN_ROUTER from "./abis/abi_evm_burn_router.json";
import { useSystemStore } from "@/stores/systemStore";

import {
  MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_SWAP_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_EVM_ROUTER_SWAP_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_BURN_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_EVM_ROUTER_BURN_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_XPHERE_FACTORY_BURN_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_XPHERE_ROUTER_BURN_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_XPHERE_FACTORY_SWAP_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_XPHERE_ROUTER_SWAP_ADDRESS,
} from "@/web3";

export const getContractSwapFactory = (signer: Signer) => {
  const isXphere =
    useSystemStore.getState().selectedNetworkId === "xphereTestnet";
  const address = isXphere
    ? MULTICHAIN_BURN_PROGRAM_XPHERE_FACTORY_SWAP_ADDRESS
    : MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_SWAP_ADDRESS;
  console.log("[getContractSwapFactory] address:", address);
  return new ethers.Contract(address, MULTICHAIN_BURN_ABI_SWAP_FACTORY, signer);
};

export const getContractSwapRouter = (signer: Signer) => {
  const isXphere =
    useSystemStore.getState().selectedNetworkId === "xphereTestnet";
  const address = isXphere
    ? MULTICHAIN_BURN_PROGRAM_XPHERE_ROUTER_SWAP_ADDRESS
    : MULTICHAIN_BURN_PROGRAM_EVM_ROUTER_SWAP_ADDRESS;
  console.log("[getContractSwapRouter] address:", address);
  return new ethers.Contract(address, MULTICHAIN_BURN_ABI_SWAP_ROUTER, signer);
};

export const getContractBurnFactory = (signer: Signer) => {
  const isXphere =
    useSystemStore.getState().selectedNetworkId === "xphereTestnet";
  const rawAddress = isXphere
    ? MULTICHAIN_BURN_PROGRAM_XPHERE_FACTORY_BURN_ADDRESS
    : MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_BURN_ADDRESS;
  const address = ethers.getAddress(rawAddress.toLowerCase());
  console.log("[getContractBurnFactory] address:", address);
  return new ethers.Contract(address, MULTICHAIN_BURN_ABI_BURN_FACTORY, signer);
};

export const getContractBurnRouter = (signer: Signer) => {
  const isXphere =
    useSystemStore.getState().selectedNetworkId === "xphereTestnet";
  const address = isXphere
    ? MULTICHAIN_BURN_PROGRAM_XPHERE_ROUTER_BURN_ADDRESS
    : MULTICHAIN_BURN_PROGRAM_EVM_ROUTER_BURN_ADDRESS;
  console.log("[getContractBurnRouter] address:", address);
  return new ethers.Contract(address, MULTICHAIN_BURN_ABI_BURN_ROUTER, signer);
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

export const getERC20Contract = (token: string, signer: Signer) => {
  return new ethers.Contract(
    token,
    [
      "function decimals() view returns (uint8)",
      "function balanceOf(address owner) view returns (uint256)",
      "function allowance(address owner, address spender) view returns (uint256)",
      "function approve(address spender, uint256 amount) external returns (bool)",
    ],
    signer,
  );
};
