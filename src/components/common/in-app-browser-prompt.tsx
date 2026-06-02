import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useWalletDeepLinks,
  type WalletDeepLinkEntry,
} from "@/hooks/useWalletDeepLinks";

interface Props {
  open: boolean;
  /** Close the modal without connecting. */
  onClose: () => void;
  /** "Continue Anyway" — close the modal and proceed with the normal connect flow. */
  onContinueAnyway: () => void;
}

function WalletCard({
  entry,
  currentUrl,
}: {
  entry: WalletDeepLinkEntry;
  currentUrl: string;
}) {
  const { name, imageUrl, buildLink } = entry;
  return (
    <a
      href={buildLink(currentUrl)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-2 py-3.5 text-center transition-colors hover:bg-white/10 active:bg-white/15"
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="size-11 rounded-xl" />
      ) : (
        <div className="size-11 rounded-xl bg-white/10" />
      )}
      <span className="font-inter line-clamp-2 text-[11px] font-medium leading-tight text-white/85">
        {name}
      </span>
    </a>
  );
}

/**
 * Modal shown to users who access the dApp from an external mobile browser
 * (Safari, Chrome for iOS/Android, etc.).
 *
 * The first screen shows featured/top wallets only. A "More Wallets" button
 * reveals additional wallets fetched from the WalletConnect Explorer API.
 *
 * Solana wallets (Phantom, Solflare) are shown in a separate section when
 * `SHOW_SOL_WALLETS` is enabled in `useWalletDeepLinks.ts`.
 */
export function InAppBrowserPrompt({
  open,
  onClose,
  onContinueAnyway,
}: Props) {
  const { entries, isLoading } = useWalletDeepLinks(open);
  const [showMore, setShowMore] = useState(false);
  const currentUrl = window.location.href;

  const evmEntries = entries.filter((e) => !e.isSolana);
  const solEntries = entries.filter((e) => e.isSolana);

  // First screen: only featured (curated top) wallets. Expand with showMore.
  const visibleEvm = showMore ? evmEntries : evmEntries.filter((e) => e.featured);
  const hasMore = !showMore && evmEntries.some((e) => !e.featured);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-sm gap-4 border-white/10 bg-[#141520] px-5 pb-5 pt-6"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="gap-1.5">
          <DialogTitle className="font-orbitron text-lg font-semibold text-white">
            Open in Wallet Browser
          </DialogTitle>
          <DialogDescription className="font-inter text-sm leading-relaxed text-white/55">
            For the best experience, open this page in your wallet&apos;s
            built-in browser. Wallet signatures can be unreliable in external
            mobile browsers.
          </DialogDescription>
        </DialogHeader>

        {/* EVM wallet grid */}
        <div className="grid grid-cols-3 gap-2">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-2 py-3.5"
                >
                  <div className="size-11 animate-pulse rounded-xl bg-white/10" />
                  <div className="h-2.5 w-14 animate-pulse rounded bg-white/10" />
                </div>
              ))
            : visibleEvm.map((entry) => (
                <WalletCard
                  key={entry.id}
                  entry={entry}
                  currentUrl={currentUrl}
                />
              ))}
        </div>

        {/* More Wallets — only shown when API returned extras beyond the featured set */}
        {!isLoading && hasMore && (
          <Button
            variant="ghost"
            className="h-auto w-full py-1.5 font-inter text-sm text-white/50 hover:bg-white/5 hover:text-white/75"
            onClick={() => setShowMore(true)}
          >
            More Wallets ↓
          </Button>
        )}

        {/* Solana section — rendered only when SHOW_SOL_WALLETS is true */}
        {!isLoading && solEntries.length > 0 && (
          <>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-white/10" />
              <span className="font-inter text-[11px] font-medium uppercase tracking-wider text-white/30">
                Solana
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {solEntries.map((entry) => (
                <WalletCard
                  key={entry.id}
                  entry={entry}
                  currentUrl={currentUrl}
                />
              ))}
            </div>
          </>
        )}

        {/* Escape hatch — proceed with the normal WalletConnect/AppKit flow */}
        <Button
          variant="ghost"
          className="w-full font-inter text-sm text-white/35 hover:bg-white/5 hover:text-white/55"
          onClick={onContinueAnyway}
        >
          Continue Anyway
        </Button>
      </DialogContent>
    </Dialog>
  );
}
