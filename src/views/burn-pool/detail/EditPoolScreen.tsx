import React, { useState } from "react";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { poolService } from "@/services/poolService";
import { useEditPoolEvmFn } from "./hooks/useEditPoolEvmFn";
import { useEditPoolSolFn } from "./hooks/useEditPoolSolFn";
import { useAppKitAccount } from "@reown/appkit/react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { BURN_POOL_STATUS } from "@/types/admin/whitelist-token";
import AnimateIconButton from "@/components/common/animate-icon-button";
import type { BurnPoolStatus } from "@/types/pool";
import PoolOverview from "./pool-overview";

export default function EditPoolScreen({
  poolAddress,
}: {
  poolAddress: string;
}) {
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { caipAddress } = useAppKitAccount();
  const namespace = caipAddress?.split(":")[0];
  const isSolana = namespace === "solana";
  const { editPool: editPoolEvm } = useEditPoolEvmFn();
  const { editPool: editPoolSol } = useEditPoolSolFn();

  const { data: poolDetail, isLoading: isLoadingPoolDetail } = useQuery({
    queryKey: poolQueryKeys.detail(poolAddress),
    queryFn: () => poolService.getPoolDetail(poolAddress),
  });

  const [startTime, setStartTime] = useState<Date>();
  const [endTime, setEndTime] = useState<Date>();

  React.useEffect(() => {
    if (poolDetail?.pool) {
      setStartTime(new Date(Number(poolDetail.pool.timeStart) * 1000));
      setEndTime(new Date(Number(poolDetail.pool.timeEnd) * 1000));
    }
  }, [poolDetail]);

  const pool = poolDetail?.pool;
  const safeStatus: BurnPoolStatus = (pool?.status as BurnPoolStatus) ?? "draft";

  const formatScheduleTime = (ts: string) =>
    format(new Date(Number(ts) * 1000), "MMM dd, yyyy, HH:mm") + " UTC";

  const handleSave = async () => {
    if (!pool || !startTime || !endTime) return;
    setSaving(true);
    try {
      if (isSolana) {
        await editPoolSol({
          poolAddress: pool.address,
          poolDetail: poolDetail!,
          startTime: Math.floor(startTime.getTime() / 1000),
          endTime: Math.floor(endTime.getTime() / 1000),
        });
      } else {
        await editPoolEvm({
          poolAddress: pool.address,
          name: pool.name,
          startTime: Math.floor(startTime.getTime() / 1000),
          endTime: Math.floor(endTime.getTime() / 1000),
        });
      }
      toast.success("Pool updated!");
      navigate({ to: `/burn/detail/${pool.address}` });
    } catch (e) {
      // error handled in hook
    } finally {
      setSaving(false);
    }
  };

  if (isLoadingPoolDetail || !pool) return <div className="p-8">Loading...</div>;

  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const isSaveDisabled =
    saving ||
    !startTime ||
    !endTime ||
    startTime >= endTime;

  return (
    <div className="pt-9.5 pl-14 pr-14">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-semibold">Update Pool</h2>
          <p className="text-base text-greyed">
            Update the pool start and end time (available before approval only).
          </p>
        </div>
        <AnimateIconButton
          iconLetter={BURN_POOL_STATUS[safeStatus]?.letter}
          textVariant="text-container-center"
          text={BURN_POOL_STATUS[safeStatus]?.label}
          color={BURN_POOL_STATUS[safeStatus]?.color}
          hasGroupHover
          classNames={{
            btn: "min-w-27 cursor-default after:text-2xl after:font-medium",
            text: "text-2xl font-medium",
            icon: "size-9 text-3xl",
          }}
        />
      </div>

      {/* Pool Overview */}
      <PoolOverview poolDetail={poolDetail} />

      {/* Schedule */}
      <div className="mt-3 grid grid-cols-2 gap-x-6">
        {/* Current Schedule */}
        <div className="py-4">
          <div className="flex items-center gap-2 pb-4">
            <div className="h-1.5 w-1.5 bg-black" />
            <span className="text-xl font-medium">Current Schedule</span>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2">
              <span className="text-xl text-greyed">Start Time:</span>
              <span className="text-xl text-black">{formatScheduleTime(pool.timeStart)}</span>
            </div>
            <div className="grid grid-cols-2">
              <span className="text-xl text-greyed">End Time:</span>
              <span className="text-xl text-black">{formatScheduleTime(pool.timeEnd)}</span>
            </div>
          </div>
        </div>

        {/* Update Schedule */}
        <div className="py-4">
          <div className="flex items-center gap-2 pb-4">
            <div className="h-1.5 w-1.5 bg-black" />
            <span className="text-xl font-medium">Update Schedule</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <div className="space-y-1">
              <span className="text-base text-greyed">Start Time:</span>
              <DatePicker
                value={startTime}
                onChange={(d) => d && setStartTime(d)}
                disabled={(d) => d < today}
              />
            </div>
            <div className="space-y-1">
              <span className="text-base text-greyed">End Time:</span>
              <DatePicker
                value={endTime}
                onChange={(d) => d && setEndTime(d)}
                disabled={(d) => d < today}
              />
            </div>
          </div>
          <ul className="mt-4 space-y-1.5 text-sm text-greyed">
            <li>• Start time must be before end time.</li>
            <li>• Past dates cannot be selected.</li>
            <li>• The pool can only be updated before approval.</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 flex justify-end gap-4">
        <AnimateIconButton
          iconLetter="C"
          text="Cancel"
          variant="letter-icon"
          textVariant="text-container-center"
          classNames={{
            btn: "w-60 text-center after:text-xl after:text-primary-foreground after:bg-[#FF8E97]",
            text: "text-xl font-medium",
            icon: "size-7.5 text-xl",
          }}
          color="#FF8E97"
          btnProps={{
            type: "button",
            disabled: saving,
            onClick: () => navigate({ to: `/burn/detail/${pool.address}` }),
          }}
        />
        <AnimateIconButton
          iconLetter="S"
          text="Save Changes"
          variant="letter-icon"
          textVariant="text-container-center"
          classNames={{
            btn: "w-60 text-center after:text-xl after:bg-[#966EFF] after:text-primary-foreground border border-active",
            text: "text-xl font-medium",
            icon: "size-7.5 text-xl",
          }}
          color="#966EFF"
          isLoading={saving}
          isLoadingText="Saving..."
          btnProps={{
            type: "button",
            disabled: isSaveDisabled,
            onClick: handleSave,
          }}
        />
      </div>
    </div>
  );
}

