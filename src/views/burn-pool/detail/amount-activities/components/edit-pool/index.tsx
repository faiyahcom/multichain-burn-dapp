import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import AnimateIconButton from "@/components/common/animate-icon-button";
import type { PoolDetailResponse } from "@/types/pool";

const editFormSchema = z
  .object({
    poolName: z
      .string()
      .trim()
      .min(1, { message: "Pool name is required" })
      .min(3, { message: "Pool name must be at least 3 characters" })
      .max(30, { message: "Pool name must be at most 30 characters" }),
    startTime: z.date({ message: "Start time is required" }),
    endTime: z.date({ message: "End time is required" }),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

type EditFormValues = z.infer<typeof editFormSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolDetail?: PoolDetailResponse;
  onConfirm: (values: {
    name: string;
    startTime: number;
    endTime: number;
  }) => Promise<void>;
};

const EditPoolDialog = ({
  open,
  onOpenChange,
  poolDetail,
  onConfirm,
}: Props) => {
  const pool = poolDetail?.pool;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
  });

  const startTime = watch("startTime");
  const endTime = watch("endTime");

  useEffect(() => {
    if (open && pool) {
      reset({
        poolName: pool.name,
        startTime: new Date(Number(pool.timeStart) * 1000),
        endTime: new Date(Number(pool.timeEnd) * 1000),
      });
      setFocus("poolName");
    }
  }, [open, pool, reset]);

  const onSubmit = async (data: EditFormValues) => {
    await onConfirm({
      name: data.poolName,
      startTime: Math.floor(data.startTime.getTime() / 1000),
      endTime: Math.floor(data.endTime.getTime() / 1000),
    });
    reset();
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogContent
          showCloseButton={false}
          className="h-fit w-full bg-primary-foreground px-10 py-6 sm:max-w-2xl"
        >
          <DialogHeader className="mt-4 text-center">
            <DialogTitle className="text-3xl font-semibold uppercase">
              Edit Pool
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-2">
            {/* Pool Name */}
            <div className="space-y-2">
              <label className="text-sm text-secondary-text">Pool Name</label>
              <Input
                className="rounded-xl px-5 py-3 text-base"
                placeholder="Enter Pool Name"
                aria-invalid={!!errors.poolName}
                {...register("poolName")}
              />
              {errors.poolName && (
                <p className="text-xs text-destructive">
                  {errors.poolName.message}
                </p>
              )}
            </div>

            {/* Time pickers */}
            <div className="flex gap-4">
              <div className="space-y-2">
                <label className="text-sm text-secondary-text">
                  Start Time
                </label>
                <DatePicker
                  value={startTime}
                  onChange={(date) =>
                    setValue("startTime", date as Date, {
                      shouldValidate: true,
                    })
                  }
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
                <input
                  type="hidden"
                  {...register("startTime", {
                    required: "Start time is required",
                    validate: (value) => {
                      if (value <= new Date())
                        return "Start time must be in the future";
                      if (endTime && value >= endTime)
                        return "Start time must be before end time";
                      return true;
                    },
                  })}
                />
                {errors.startTime && (
                  <p className="text-xs text-destructive">
                    {errors.startTime.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm text-secondary-text">End Time</label>
                <DatePicker
                  value={endTime}
                  onChange={(date) =>
                    setValue("endTime", date as Date, {
                      shouldValidate: true,
                    })
                  }
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return (
                      date < today || (startTime ? date < startTime : false)
                    );
                  }}
                />
                <input
                  type="hidden"
                  {...register("endTime", {
                    required: "End time is required",
                    validate: (value) => {
                      if (value <= new Date())
                        return "End time must be in the future";
                      if (startTime && value <= startTime)
                        return "End time must be after start time";
                      return true;
                    },
                  })}
                />
                {errors.endTime && (
                  <p className="text-xs text-destructive">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <AnimateIconButton
                iconLetter="C"
                text="Cancel"
                variant="letter-icon"
                textVariant="text-container-center"
                classNames={{
                  btn: "w-60 text-center after:text-2xl after:text-primary-foreground after:bg-[#FF8E97]",
                  text: "text-2xl font-medium",
                  icon: "size-7.5 text-2xl",
                }}
                color="#FF8E97"
                btnProps={{
                  type: "button",
                  onClick: handleCancel,
                  disabled: isSubmitting,
                }}
              />
              <AnimateIconButton
                iconLetter="E"
                text="Edit"
                variant="letter-icon"
                textVariant="text-container-center"
                classNames={{
                  btn: "w-60 text-center after:text-2xl after:bg-[#966EFF] after:text-primary-foreground border border-active",
                  text: "text-2xl font-medium",
                  icon: "size-7.5 text-2xl",
                }}
                color="#966EFF"
                isLoading={isSubmitting}
                isLoadingText="Editing..."
                btnProps={{
                  type: "submit",
                  disabled: isSubmitting,
                }}
              />
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default EditPoolDialog;
