import type { ErrorResponseData } from "@/types/common";
import axios from "axios";
import { getReadableEvmErrorMessage } from "./evm-error";
import { getReadableSolanaErrorMessage } from "./solana-error";

export const getErrorMessage = ({
  error,
  fallbackMsg = "An unknown error occurred. Please try again.",
}: {
  error: unknown;
  fallbackMsg?: string;
}) => {
  if (axios.isAxiosError<ErrorResponseData>(error)) {
    return error.response?.data?.message || fallbackMsg;
  }

  const solanaErrorMessage = getReadableSolanaErrorMessage(error);
  if (solanaErrorMessage) {
    return solanaErrorMessage;
  }

  const evmErrorMessage = getReadableEvmErrorMessage(error);
  if (evmErrorMessage) {
    return evmErrorMessage;
  }

  if (error instanceof Error) {
    return error.message || fallbackMsg;
  }

  return fallbackMsg;
};
