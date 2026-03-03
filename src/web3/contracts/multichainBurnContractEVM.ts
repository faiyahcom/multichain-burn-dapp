import { ethers, type Signer } from "ethers";
import MULTICHAIN_BURN_ABI from "./multichain_burn_abi_evm.json";
import { MULTICHAIN_BURN_PROGRAM_EVM_ADDRESS } from "@/web3";

export const getMultichainBurnContract = (signer: Signer) => {
    return new ethers.Contract(
        MULTICHAIN_BURN_PROGRAM_EVM_ADDRESS,
        MULTICHAIN_BURN_ABI,
        signer
    );
};

export const getERC20Contract = (token: string, signer: Signer) => {
    return new ethers.Contract(
        token,
        [
            "function decimals() view returns (uint8)",
            "function approve(address spender, uint256 amount) external returns (bool)",
        ],
        signer
    );
};