import { ethers } from "ethers";

const ONCHAIN_ERROR_MESSAGES = {
  MultisigWalletRequired: "Action must be executed by the multisig wallet.",
  InvalidAddress: "Provided address is invalid.",
  InvalidCreationFee: "Creation fee is invalid.",
  NotAuthorized: "Current wallet is not authorized to perform this action.",
  InvalidValue: "Transaction value is invalid.",
  InvalidTimeRange: "Start time and end time are invalid.",
  InvalidPoolStatus: "Pool status does not allow this action.",
  InvalidAmount: "Amount is invalid.",
  NotInWhitelist: "Address is not in the whitelist.",
  PoolEnded: "Pool has already ended.",
  ArrayLengthMismatch: "Input arrays must have the same length.",
  InvalidAssetType: "Asset type is invalid.",
  AlreadyClaimed: "Reward has already been claimed.",
  InvalidDecimals: "Token decimals are invalid.",
  InvalidSettlementFee: "Settlement fee is invalid.",
  LengthMismatch: "Input lengths do not match.",
  PoolAlreadyClose: "Pool is already closed.",
  PoolClosed: "Pool is closed.",
  PoolNotClosed: "Pool is not closed yet.",
  InvalidRatio: "Ratio is invalid.",
  PoolMasterContractNotSet: "Pool master contract is not configured.",
  NotPool: "Target address is not a valid pool.",
  NotOperator: "Current wallet is not an operator.",
  NotProjectOwner: "Current wallet is not the project owner.",
  NotOwner: "Current wallet is not the owner.",
  AlreadyInitialized: "Contract is already initialized.",
  RewardTooSmall: "Reward amount is too small.",
  InsufficientReward: "Insufficient reward balance.",
  PoolAlreadyClosed: "Pool is already closed.",
  InvalidArrayLength: "Input array length is invalid.",
  TokenNotWhitelisted: "Selected token is not whitelisted.",
  AddressNotWhitelisted: "Wallet address is not whitelisted.",
  NoStateChange: "No state change to apply.",
  InvalidAssetPair: "Asset pair is invalid.",
} as const;

type OnchainErrorName = keyof typeof ONCHAIN_ERROR_MESSAGES;

const ERROR_NAMES = Object.keys(ONCHAIN_ERROR_MESSAGES) as OnchainErrorName[];
const ERROR_SELECTOR_TO_MESSAGE = new Map(
  ERROR_NAMES.map((name) => [
    ethers.id(`${name}()`).slice(0, 10).toLowerCase(),
    ONCHAIN_ERROR_MESSAGES[name],
  ]),
);

const ERROR_TEXT_PATHS = [
  ["data"],
  ["shortMessage"],
  ["reason"],
  ["details"],
  ["message"],
  ["error", "data"],
  ["error", "message"],
  ["info", "error", "data"],
  ["info", "error", "message"],
  ["cause", "data"],
  ["cause", "message"],
] as const;

const USER_REJECTED_REGEX =
  /user rejected|user denied|rejected the request|action rejected/i;
const REVERT_REASON_REGEX =
  /execution reverted(?::|\s*\(reason="?)([^",)]+)"?/i;
const SELECTOR_REGEX = /0x[a-fA-F0-9]{8,}/;

const getValueAtPath = (value: unknown, path: readonly string[]) =>
  path.reduce<unknown>(
    (current, key) =>
      typeof current === "object" && current !== null
        ? (current as Record<string, unknown>)[key]
        : undefined,
    value,
  );

const getErrorTexts = (error: unknown) =>
  ERROR_TEXT_PATHS.flatMap((path) => {
    const value = getValueAtPath(error, path);
    return typeof value === "string" && value.trim() ? [value.trim()] : [];
  });

const getMappedMessage = (text: string) => {
  const selector = text.match(SELECTOR_REGEX)?.[0]?.slice(0, 10).toLowerCase();
  if (selector) {
    const message = ERROR_SELECTOR_TO_MESSAGE.get(selector);
    if (message) return message;
  }

  const errorName = ERROR_NAMES.find((name) => text.includes(name));
  return errorName ? ONCHAIN_ERROR_MESSAGES[errorName] : null;
};

const cleanFallbackMessage = (text: string) => {
  if (USER_REJECTED_REGEX.test(text)) {
    return "Transaction rejected in wallet.";
  }

  const revertReason = text.match(REVERT_REASON_REGEX)?.[1]?.trim();
  if (revertReason) {
    return revertReason;
  }

  const compact = text.replace(/\s*\(action="[^"]+".*$/i, "").trim();
  return /execution reverted/i.test(compact)
    ? "Transaction reverted by contract."
    : compact;
};

export const getReadableEvmErrorMessage = (error: unknown): string | null => {
  const texts = getErrorTexts(error);

  for (const text of texts) {
    const mappedMessage = getMappedMessage(text);
    if (mappedMessage) {
      return mappedMessage;
    }
  }

  return texts[0] ? cleanFallbackMessage(texts[0]) : null;
};
