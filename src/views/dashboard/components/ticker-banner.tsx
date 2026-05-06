interface TickerBannerProps {
  items: string[];
  separator?: string;
  /** Animation duration in seconds (default: 30) */
  speed?: number;
}

export function TickerBanner({
  items,
  separator = "\u00a0\u00a0\u00a0\u00a0",
  speed = 60,
}: TickerBannerProps) {
  const text = items.join(separator);

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        backgroundImage: "url('/images/dashboard/banner-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        // Force this element onto its own GPU compositing layer so the
        // background PNG is rasterised once and not repainted on every marquee
        // frame.  Without this, Safari / WebKit on M1 repaints the background
        // every tick of the CSS animation, visually degrading the image.
        transform: "translateZ(0)",
        isolation: "isolate",
      }}
    >
      {/* Only the inner flex row scrolls; the wrapper is static */}
      <div
        className="animate-marquee inline-flex whitespace-nowrap"
        style={{
          animationDuration: `${speed}s`,
          // Explicit inline hint for Safari — ensures the prefixed property is
          // set even if the @utility CSS rule is parsed after layout.
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
        }}
      >
        <span className="font-ds-digital font-bold text-60px leading-none text-banner-text tracking-[0.12em] px-8">
          {text}
        </span>
        <span
          aria-hidden
          className="font-ds-digital font-bold text-60px leading-none text-banner-text tracking-[0.12em] px-8"
        >
          {text}
        </span>
      </div>
    </div>
  );
}
