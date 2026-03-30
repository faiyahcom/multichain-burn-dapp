import type { ContainerVariant } from "@/components/common/glow/container";
import {
  getPoolStatusLabel,
  type PoolItemType,
} from "@/types/admin/master-pool-management";
import { PoolKindCodeEnum, type PoolKindCode } from "@/types/pool";
import {
  formatCountdown,
  formatTimestampSecondsToDate,
} from "@/utils/helpers/string";

export const getPoolGlowVariant = (
  poolKind: PoolKindCode,
): ContainerVariant => {
  return poolKind === PoolKindCodeEnum.Burn ? "burn" : "swap";
};

export const renderBurnPoolTime = (pool: PoolItemType): string => {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  // all possible status is stored in userViewBurnPoolStatuses
  if (pool.status !== "upcoming" && pool.status !== "on_going") {
    // return nothing for pending and holding
    if (pool.status === "pending" || pool.status === "holding") {
      return "\u00A0"; // non-breaking space
    }
    // return formatted end date for ended
    if (pool.status === "ended") {
      return formatTimestampSecondsToDate({
        timestamp: pool.timeEnd,
        formatStr: "yyyy-MM-dd",
      });
    }
  }

  const timeStart = Number(pool.timeStart);
  const timeEnd = Number(pool.timeEnd);

  const renderTimeEnd = () => {
    if (isNaN(timeEnd)) {
      return "00:00:00";
    }
    const diffEnd = timeEnd - nowInSeconds;
    if (diffEnd > 0) {
      return formatCountdown(diffEnd);
    } else {
      return getPoolStatusLabel("ended");
    }
  };

  if (pool.status === "upcoming") {
    if (isNaN(timeStart)) {
      return "00:00:00";
    }
    const diffStart = timeStart - nowInSeconds;
    if (diffStart > 0) {
      return formatCountdown(diffStart);
    } else {
      return renderTimeEnd();
    }
  }

  if (pool.status === "on_going") {
    return renderTimeEnd();
  }

  // Fallback for any unexpected status
  return "\u00A0";
};
