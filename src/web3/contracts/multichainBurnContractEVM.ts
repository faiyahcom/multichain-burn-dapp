import { ethers, type Signer } from "ethers";
import MULTICHAIN_BURN_ABI_SWAP_FACTORY from "./abi_evm_swap_factory.json";
import MULTICHAIN_BURN_ABI_SWAP_ROUTER from "./abi_evm_swap_router.json";
import MULTICHAIN_BURN_ABI_BURN_FACTORY from "./abi_evm_burn_factory.json";
import MULTICHAIN_BURN_ABI_BURN_ROUTER from "./abi_evm_burn_router.json";
import {
    MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_SWAP_ADDRESS,
    MULTICHAIN_BURN_PROGRAM_EVM_ROUTER_SWAP_ADDRESS,
    MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_BURN_ADDRESS,
    MULTICHAIN_BURN_PROGRAM_EVM_ROUTER_BURN_ADDRESS,
} from "@/web3";

export const getContractSwapFactory = (signer: Signer) => {
    return new ethers.Contract(
        MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_SWAP_ADDRESS,
        MULTICHAIN_BURN_ABI_SWAP_FACTORY,
        signer,
    );
};

export const getContractSwapRouter = (signer: Signer) => {
    return new ethers.Contract(
        MULTICHAIN_BURN_PROGRAM_EVM_ROUTER_SWAP_ADDRESS,
        MULTICHAIN_BURN_ABI_SWAP_ROUTER,
        signer,
    );
};

export const getContractBurnFactory = (signer: Signer) => {
    const rawAddress =
        MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_BURN_ADDRESS;

    const normalized = ethers.getAddress(rawAddress.toLowerCase());

    console.log("Normalized factory:", normalized);

    return new ethers.Contract(
        normalized,
        MULTICHAIN_BURN_ABI_BURN_FACTORY,
        signer,
    );
};

export const getContractBurnRouter = (signer: Signer) => {
    return new ethers.Contract(
        MULTICHAIN_BURN_PROGRAM_EVM_ROUTER_BURN_ADDRESS,
        MULTICHAIN_BURN_ABI_BURN_ROUTER,
        signer,
    );
};

export const getERC20Contract = (token: string, signer: Signer) => {
    return new ethers.Contract(
        token,
        [
            "function decimals() view returns (uint8)",
            "function approve(address spender, uint256 amount) external returns (bool)",
        ],
        signer,
    );
};
