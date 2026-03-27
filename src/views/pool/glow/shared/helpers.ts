import type { ContainerVariant } from "@/components/common/glow/container";
import { PoolKindCodeEnum, type PoolKindCode } from "@/types/pool";

export const getPoolGlowVariant = (
  poolKind: PoolKindCode,
): ContainerVariant => {
  return poolKind === PoolKindCodeEnum.Burn ? "burn" : "swap";
};
