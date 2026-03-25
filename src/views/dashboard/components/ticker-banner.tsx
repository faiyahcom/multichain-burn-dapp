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
      style={{ backgroundImage: "url('/images/banner-bg.png')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {/* Only the inner flex row scrolls; the wrapper is static */}
      <div
        className="animate-marquee inline-flex whitespace-nowrap"
        style={{ animationDuration: `${speed}s` }}
      >
        <span className="font-ds-digital font-bold text-[60px] leading-none text-banner-text tracking-[0.12em] px-8">
          {text}
        </span>
        <span
          aria-hidden
          className="font-ds-digital font-bold text-[60px] leading-none text-banner-text tracking-[0.12em] px-8"
        >
          {text}
        </span>
      </div>
    </div>
  );
}
