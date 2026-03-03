import type { ErrorResponseData } from "@/types/common";
import axios from "axios";

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

  if (error instanceof Error) {
    return error.message || fallbackMsg;
  }

  return fallbackMsg;
};
