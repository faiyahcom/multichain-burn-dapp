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
import { DatePicker } from "@/components/common/glow/date-picker";
import { Input } from "@/components/common/glow/input";
import { Button } from "@/components/common/glow/button";
import { cn } from "@/lib/utils";
import {
  getVariantBgClassName,
  getVariantBorderClassName,
  getVariantShadowClassName,
} from "@/components/common/glow/container";
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
          className={cn(
            "h-fit w-full bg-background p-0 sm:max-w-2xl sm:p-0 sm:px-8 md:p-0 xl:max-w-3xl",
            getVariantBorderClassName({
              variant: "burn",
              custom: "rounded-xl",
            }),
            getVariantShadowClassName({ variant: "burn" }),
          )}
        >
          <div
            className={cn(
              "h-fit w-full px-6 py-8",
              getVariantBgClassName({ variant: "burn" }),
            )}
          >
            <DialogHeader className="text-center">
              <DialogTitle className="mb-4 font-orbitron text-2xl font-semibold uppercase sm:text-3xl xl:text-4xl 2xl:mb-8">
                Edit Pool
              </DialogTitle>
            </DialogHeader>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-6"
            >
              {/* Pool Name */}
              <div className="flex flex-col gap-2">
                <label className="font-inter text-base font-medium">
                  Pool Name
                </label>
                <Input
                  variant="burn"
                  placeholder="Enter Pool Name"
                  aria-invalid={!!errors.poolName}
                  className="w-full bg-transparent"
                  {...register("poolName")}
                />
                {errors.poolName && (
                  <p className="font-inter text-xs text-destructive">
                    {errors.poolName.message}
                  </p>
                )}
              </div>

              {/* Time pickers */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex flex-1 flex-col gap-2">
                  <label className="font-inter text-base font-medium">
                    Start Time
                  </label>
                  <DatePicker
                    variant="burn"
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
                    className="rounded-md px-3 py-5 text-base lg:text-lg xl:text-xl 2xl:text-23px"
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
                    <p className="font-inter text-xs text-destructive">
                      {errors.startTime.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <label className="font-inter text-base font-medium">
                    End Time
                  </label>
                  <DatePicker
                    variant="burn"
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
                    className="rounded-md px-3 py-5 text-base lg:text-lg xl:text-xl 2xl:text-23px"
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
                    <p className="font-inter text-xs text-destructive">
                      {errors.endTime.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                <Button
                  variant="burn-active"
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  hasHover
                  className="flex-1 font-orbitron text-base font-semibold xl:text-2xl"
                >
                  Cancel
                </Button>
                <Button
                  variant="burn"
                  type="submit"
                  isLoading={isSubmitting}
                  hasHover
                  className="flex-1 font-orbitron text-base font-semibold xl:text-2xl"
                >
                  {isSubmitting ? "Editing..." : "Edit"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default EditPoolDialog;
