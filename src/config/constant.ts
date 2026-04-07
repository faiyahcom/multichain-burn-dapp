import { ethers } from "ethers";
import { NATIVE_MINT } from "@solana/spl-token";

export const APPKIT_PROJECT_ID = import.meta.env.VITE_REOWN_PROJECT_ID;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL !== undefined
    ? import.meta.env.VITE_API_BASE_URL
    : "http://localhost:8080";

export const ZERO_ADDRESS = ethers.ZeroAddress;
export const WSOL_ADDRESS = NATIVE_MINT.toString();
export const DEFAULT_NATIVE_DECIMALS = 18;
export const DEFAULT_INPUT_NUMBER_STEP = "0.000001";

export const WRONG_NETWORK_ERROR_MESSAGE =
  "Please switch to an account on the correct network to continue.";
