import {
  IconSpinner,
  IconToastError,
  IconToastInfo,
  IconToastSuccess,
  IconToastWarning,
} from "@/assets/react";
import { cn } from "@/lib/utils";
import { type ExternalToast, toast as sonnerToast } from "sonner";

type ToastVariant =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "loading"
  | "default";

const variantConfig: Record<
  ToastVariant,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  default: {
    icon: ({ className }) => <div className={className} />,
    color: "",
  },
  success: {
    icon: IconToastSuccess,
    color: "#01D201",
  },
  error: {
    icon: IconToastError,
    color: "#FF5562",
  },
  warning: {
    icon: IconToastWarning,
    color: "#FFAE00",
  },
  info: {
    icon: IconToastInfo,
    color: "#016DD2",
  },
  loading: {
    icon: ({ className }) => (
      <IconSpinner className={cn("animate-spin", className)} />
    ),
    color: "",
  },
};

type ToastData = ExternalToast & { description?: string };

interface CustomToastProps {
  id?: string;
  variant: ToastVariant;
  toastProps: {
    message: string;
    data?: ToastData;
  };
}

const CustomToast: React.FC<CustomToastProps> = ({
  id,
  variant,
  toastProps,
}) => {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const description = toastProps.data?.description;
  const shortenDescription =
    typeof description === "string" && description?.length > 150
      ? description.slice(0, 150) + "..."
      : description;

  return (
    <div
      style={
        {
          "--color": config.color,
        } as React.CSSProperties
      }
      className="relative flex min-w-94.75 items-start gap-2.25 overflow-hidden rounded-[10px] bg-mb-popover px-7.5 py-4"
      id={id}
    >
      <div className="absolute top-0 left-0 h-full w-2.25 bg-(--color)" />
      <Icon className="size-5.25 shrink-0 mt-[1.5px]" />
      <div>
        <p className="text-base font-semibold text-(--color)">
          {toastProps.message}
        </p>
        {description && (
          <p className="pl-0.75 text-[13px] font-normal text-[#5B5B5B]">
            {shortenDescription}
          </p>
        )}
      </div>
    </div>
  );
};

const showToast = ({ variant, toastProps }: CustomToastProps) => {
  return sonnerToast.custom(
    (id) => (
      <CustomToast
        variant={variant}
        toastProps={toastProps}
        id={id.toString()}
      />
    ),
    {
      ...toastProps.data,
    },
  );
};

export const toast = Object.assign(
  (message: string, options?: ToastData) =>
    showToast({ variant: "default", toastProps: { message, data: options } }),
  {
    success: (message: string, options?: ToastData) =>
      showToast({ variant: "success", toastProps: { message, data: options } }),
    error: (message: string, options?: ToastData) =>
      showToast({ variant: "error", toastProps: { message, data: options } }),
    warning: (message: string, options?: ToastData) =>
      showToast({ variant: "warning", toastProps: { message, data: options } }),
    info: (message: string, options?: ToastData) =>
      showToast({ variant: "info", toastProps: { message, data: options } }),
    loading: (message: string, options?: ToastData) =>
      showToast({ variant: "loading", toastProps: { message, data: options } }),
    dismiss: sonnerToast.dismiss,
    promise: sonnerToast.promise,
    message: sonnerToast.message,
  },
);
