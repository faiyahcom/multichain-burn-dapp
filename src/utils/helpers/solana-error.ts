const SOLANA_IDL_ERRORS = [
  { code: 6000, name: "InvalidAssetType", msg: "Invalid asset type" },
  { code: 6001, name: "PoolNotCreated", msg: "Pool not in created state" },
  { code: 6002, name: "PoolNotDeposited", msg: "Pool not deposited" },
  { code: 6003, name: "PoolNotApproved", msg: "Pool not approved" },
  { code: 6004, name: "PoolApproved", msg: "Pool approved" },
  { code: 6005, name: "PoolNotActive", msg: "Pool not active" },
  { code: 6006, name: "PoolAlreadyActive", msg: "Pool already active" },
  { code: 6007, name: "ZeroAmount", msg: "Zero amount" },
  { code: 6008, name: "NativeAmountZero", msg: "Native amount zero" },
  {
    code: 6009,
    name: "InsufficientRewardBalance",
    msg: "Insufficient reward balance",
  },
  { code: 6010, name: "PoolNotEnded", msg: "Pool not ended" },
  { code: 6011, name: "Unauthorized", msg: "Unauthorized" },
  { code: 6012, name: "MerkleRootNotSet", msg: "Merkle root not set" },
  { code: 6013, name: "AlreadyClaimed", msg: "Already claimed" },
  { code: 6014, name: "InvalidMerkleProof", msg: "Invalid merkle proof" },
  { code: 6015, name: "RatioMustBeZero", msg: "Ratio must be zero" },
  { code: 6016, name: "PoolPaused", msg: "Pool is paused" },
  { code: 6017, name: "PoolClosed", msg: "Pool is closed" },
  { code: 6018, name: "PoolNotClosed", msg: "Pool not closed" },
  { code: 6019, name: "InvalidAddress", msg: "Invalid address" },
  { code: 6020, name: "InvalidTimeRange", msg: "Invalid time range" },
  { code: 6021, name: "InvalidCreationFee", msg: "Invalid creation fee" },
  { code: 6022, name: "MathOverflow", msg: "Math overflow" },
  {
    code: 6023,
    name: "TargetAddressNotMatch",
    msg: "Target address not match",
  },
  { code: 6024, name: "NotFixedPool", msg: "Not fixed pool" },
  { code: 6025, name: "EmptyReward", msg: "Empty reward token" },
  {
    code: 6026,
    name: "PoolAlreadyCollected",
    msg: "Pool already collected",
  },
  { code: 6027, name: "PoolNotDraft", msg: "Pool not in draft" },
  { code: 6028, name: "PoolNotPending", msg: "Pool not in pending" },
  { code: 6029, name: "PoolEnded", msg: "Pool ended" },
  { code: 6030, name: "PoolNotDynamic", msg: "Pool not dynamic" },
  {
    code: 6031,
    name: "InvalidRatio",
    msg: "Invalid ratio: denominator must be greater than zero",
  },
  { code: 6032, name: "InvalidInput", msg: "Invalid input" },
  {
    code: 6033,
    name: "RewardTooSmall",
    msg: "Reward amount too small (rounds to zero)",
  },
] as const;

const SOLANA_ERROR_NAMES = SOLANA_IDL_ERRORS.map((error) => error.name);
const SOLANA_ERROR_CODE_TO_MESSAGE = new Map(
  SOLANA_IDL_ERRORS.flatMap((error) => [
    [String(error.code), error.msg],
    [`0x${error.code.toString(16)}`, error.msg],
  ]),
);
const SOLANA_ERROR_NAME_TO_MESSAGE = new Map(
  SOLANA_IDL_ERRORS.map((error) => [error.name, error.msg]),
);

const ERROR_TEXT_PATHS = [
  ["error", "errorMessage"],
  ["error", "errorCode", "code"],
  ["error", "errorCode", "number"],
  ["message"],
  ["reason"],
  ["details"],
  ["logs"],
  ["error", "logs"],
  ["simulationResponse", "logs"],
  ["cause", "logs"],
  ["cause", "message"],
] as const;

const USER_REJECTED_REGEX =
  /user rejected|user denied|rejected the request|action rejected/i;

const getValueAtPath = (value: unknown, path: readonly string[]) =>
  path.reduce<unknown>(
    (current, key) =>
      typeof current === "object" && current !== null
        ? (current as Record<string, unknown>)[key]
        : undefined,
    value,
  );

const toTexts = (value: unknown): string[] => {
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  if (typeof value === "number") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      typeof item === "string" && item.trim() ? [item.trim()] : [],
    );
  }

  return [];
};

const getErrorTexts = (error: unknown) =>
  ERROR_TEXT_PATHS.flatMap((path) => toTexts(getValueAtPath(error, path)));

const getMappedMessage = (text: string) => {
  const hexCode = text.match(/custom program error: (0x[a-f0-9]+)/i)?.[1];
  if (hexCode) {
    const message = SOLANA_ERROR_CODE_TO_MESSAGE.get(hexCode.toLowerCase());
    if (message) return message;
  }

  const numericCode = text.match(/(?:Error Number:|custom program error:)\s*(\d+)/i)?.[1];
  if (numericCode) {
    const message = SOLANA_ERROR_CODE_TO_MESSAGE.get(numericCode);
    if (message) return message;
  }

  const errorName = SOLANA_ERROR_NAMES.find((name) => text.includes(name));
  if (errorName) {
    return SOLANA_ERROR_NAME_TO_MESSAGE.get(errorName) ?? null;
  }

  return null;
};

const cleanFallbackMessage = (text: string) => {
  if (USER_REJECTED_REGEX.test(text)) {
    return "Transaction rejected in wallet.";
  }

  return text;
};

export const getReadableSolanaErrorMessage = (error: unknown): string | null => {
  const texts = getErrorTexts(error);

  for (const text of texts) {
    const fallbackMessage = cleanFallbackMessage(text);
    if (fallbackMessage === "Transaction rejected in wallet.") {
      return fallbackMessage;
    }

    const mappedMessage = getMappedMessage(text);
    if (mappedMessage) {
      return mappedMessage;
    }
  }

  return null;
};
