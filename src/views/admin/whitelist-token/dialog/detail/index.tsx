import {
  IconClipboard,
  IconCopy,
  IconSquareArrowTopRightOut,
} from "@/assets/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { chainIdToNetworkConfig } from "@/config/networks";
import type { WhitelistToken } from "@/services/whitelistService";
import {
  booleanToTokenStatus,
  tokenStatusLabels,
} from "@/types/admin/whitelist-token";
import { toast } from "@/components/common/custom-toast";
import { format, isValid, parseISO } from "date-fns";

interface Props {
  data?: WhitelistToken;
  setData?: (data?: WhitelistToken) => void;
}

const AdminWhitelistTokenDialogDetail: React.FC<Props> = ({
  data,
  setData,
}) => {
  const networkConfig = data?.chainId
    ? chainIdToNetworkConfig(data.chainId)
    : undefined;

  const handleCopy = () => {
    if (data?.address) {
      navigator.clipboard
        .writeText(data.address)
        .then(() => {
          toast.success("Copied to clipboard");
        })
        .catch(() => {
          toast.error("Failed to copy to clipboard");
        });
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setData?.(undefined);
    }
  };

  return (
    <Dialog open={data !== undefined} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-185.75 md:px-14 md:pt-14 md:pb-6.25">
        <DialogHeader className="sr-only">
          <DialogTitle>Token Detail</DialogTitle>
          <DialogDescription>Whitelisted Token Detail</DialogDescription>
        </DialogHeader>
        <div className="w-full min-w-0">
          {/* logo + name + symbol + network + status */}
          <div className="mb-6.75 flex items-center gap-4.75 pl-3">
            <div className="aspect-square size-13.75 shrink-0 overflow-hidden rounded-2px border border-inactive bg-sub-bg">
              {data?.imageUri && (
                <img
                  src={data.imageUri}
                  alt={data.customName || data.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div>
              <p className="text-3xl font-semibold">
                {data?.customName || data?.name || "N/A"}
              </p>
              <div className="flex items-center gap-2.75">
                <p className="text-15px font-medium text-secondary-text">
                  {data?.customSymbol || data?.symbol || "N/A"}
                </p>
                <div className="flex items-center gap-2.25">
                  {networkConfig && (
                    <ColorTag
                      color={networkConfig.color}
                      text={networkConfig.shortLabel}
                    />
                  )}
                  <ColorTag
                    color={data?.enable ? "#7af4cb" : "#ff8e97"}
                    text={
                      tokenStatusLabels[booleanToTokenStatus(!!data?.enable)]
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="mb-4.5 w-full space-y-1.25">
            <p className="text-base font-medium">Contract Address</p>
            <div className="flex w-full min-w-0 items-center justify-between gap-1 rounded-md-plus bg-inactive px-5 py-2.75">
              <p
                className="min-w-0 truncate text-15px font-normal"
                title={data?.address || "N/A"}
              >
                {data?.address || "N/A"}
              </p>
              <button onClick={handleCopy}>
                <IconCopy />
              </button>
            </div>
          </div>

          {/* description */}
          <div className="mb-5.5">
            <p className="text-base font-medium">Description</p>
            <p className="text-15px font-normal text-secondary-text">
              {data?.description || "N/A"}
            </p>
          </div>

          {/* links */}
          <div className="mb-1 space-y-1.5">
            <p className="text-base font-medium">Links</p>
            {data?.homepage && (
              <Link
                href={data.homepage}
                icon={IconSquareArrowTopRightOut}
                title="Homepage"
              />
            )}
            {data?.whitepaper && (
              <Link href={data.whitepaper} icon={IconClipboard} title="Docs" />
            )}
          </div>

          {/* timestamp */}
          {data?.createdAt && isValid(parseISO(data.createdAt)) && (
            <div className="font-normal text-secondary-text">
              <p className="text-xs">Added to Whitelist</p>
              <p className="text-15px">
                {format(parseISO(data.createdAt), "yyyy-MM-dd")}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ColorTag = ({ color, text }: { color: string; text: string }) => {
  return (
    <div
      style={
        {
          "--tag-color": color,
        } as React.CSSProperties
      }
      className="flex min-w-10.75 items-center justify-center rounded-3px border border-(--tag-color) px-1 text-(--tag-color)"
    >
      <p className="text-15px font-medium">{text}</p>
    </div>
  );
};

const Link = ({
  href,
  icon,
  title,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) => {
  const Icon = icon;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-1 rounded-md-plus bg-inactive px-4.75 py-2"
    >
      <span className="flex items-center gap-6.25">
        <Icon className="shrink-0 text-secondary-text [&>path]:stroke-[1.5px]" />
        <p className="text-15px font-normal">{href}</p>
      </span>
      <p className="font-normal text-secondary-text">{title}</p>
    </a>
  );
};

export default AdminWhitelistTokenDialogDetail;
