import { IconToastWarning } from "@/assets/react";
import { cn } from "@/lib/utils";
import { CircleAlertIcon, CircleCheckIcon, CircleXIcon } from "lucide-react";
import { type ExternalToast, toast as sonnerToast } from "sonner";
import { Spinner } from "../ui/spinner";

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
    color: "var(--foreground)",
  },
  success: {
    icon: CircleCheckIcon,
    color: "#03DB92",
  },
  error: {
    icon: CircleXIcon,
    color: "#FF0000",
  },
  warning: {
    icon: IconToastWarning,
    color: "#FF8800D9",
  },
  info: {
    icon: CircleAlertIcon,
    color: "#0285FFD9",
  },
  loading: {
    icon: Spinner,
    color: "var(--foreground)",
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
          boxShadow: "0px 0px 20px var(--color)",
        } as React.CSSProperties
      }
      className={cn(
        "relative flex min-w-74 items-start gap-2.25 overflow-hidden rounded-md bg-mb-dark-popover px-2.5 py-3",
        "border-l-[0.375rem] border-(--color) font-inter",
      )}
      id={id}
    >
      <Icon className="mt-[0.094rem] size-5 shrink-0 text-(--color)" />
      <div>
        <p className="text-base font-semibold text-(--color)">
          {toastProps.message}
        </p>
        {!!description && (
          <p className="text-sm font-normal text-foreground">
            {shortenDescription}
          </p>
        )}
      </div>
    </div>
  );
};

const showToast = ({ variant, toastProps }: CustomToastProps) => {
  const { description, ...restData } = toastProps.data || {};

  return sonnerToast.custom(
    (id) => (
      <CustomToast
        variant={variant}
        toastProps={toastProps}
        id={id.toString()}
      />
    ),
    {
      ...restData,
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
