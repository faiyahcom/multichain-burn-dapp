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
import { toast } from "sonner";

interface Props {}

// TODO: replace with real data
const AdminWhitelistTokenDialogDetail = () => {
  const handleCopy = () => {
    navigator.clipboard
      .writeText("0x0000000000000000000000000000000000000000")
      .then(() => {
        toast.success("Copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard");
      });
  };

  return (
    <Dialog>
      <DialogContent className="px-14 pt-14 pb-6.25 sm:max-w-185.75">
        <DialogHeader className="sr-only">
          <DialogTitle>Token Detail</DialogTitle>
          <DialogDescription>Whitelisted Token Detail</DialogDescription>
        </DialogHeader>
        <div>
          {/* logo + name + symbol + network + status */}
          <div className="mb-6.75 flex items-center gap-4.75 pl-3">
            <div className="aspect-square size-13.75 shrink-0 overflow-hidden rounded-2px border border-inactive bg-sub-bg">
              <img
                src="/demo/sample.jpg"
                alt="sample"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-3xl font-semibold">Uniswap</p>
              <div className="flex items-center gap-2.75">
                <p className="text-15px font-medium text-secondary-text">UNI</p>
                <div className="flex items-center gap-2.25">
                  <ColorTag color="#0021FF" text="ETH" />
                  <ColorTag color="#00AF74" text="Active" />
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="mb-4.5 space-y-1.25">
            <p className="text-base font-medium">Contract Address</p>
            <div className="flex items-center justify-between gap-1 rounded-md-plus bg-inactive px-5 py-2.75">
              <p className="truncate text-15px font-normal">
                0x0000000000000000000000000000000000000000
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
              Uniswap is a decentralized trading protocol on Ethereum.
            </p>
          </div>

          {/* links */}
          <div className="mb-1 space-y-1.5">
            <p className="text-base font-medium">Links</p>
            <Link
              href="app.uniswap.org"
              icon={IconSquareArrowTopRightOut}
              title="Homepage"
            />
            <Link href="docs.uniswap.org" icon={IconClipboard} title="Docs" />
          </div>

          {/* timestamp */}
          <div className="font-normal text-secondary-text">
            <p className="text-xs">Added to Whitelist</p>
            <p className="text-15px">2026-01-15</p>
          </div>
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
