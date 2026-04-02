type Props = {
    open: boolean;
    settlementFee?: string | number | null;
};

const FeePanel = ({ open, settlementFee }: Props) => (
    <div
        className={`overflow-hidden transition-all duration-300 ${
            open ? "mt-3 max-h-40 opacity-100" : "max-h-0 opacity-0"
        }`}
    >
        <div className="w-full rounded-xl border border-swap-border/85 bg-mb-dark-popover-item p-[18px]">
            <div className="flex items-center justify-between text-sm text-foreground">
                <div className="flex items-center gap-1">
                    Fee:
                    <span className="text-xs opacity-60">ⓘ</span>
                </div>
                <div className="font-semibold text-green-500">
                    {settlementFee ? `${Number(settlementFee) / 100}%` : "Free"}
                </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-foreground">
                <div className="flex items-center gap-1">
                    Network Fee:
                    <span className="text-xs opacity-60">ⓘ</span>
                </div>
                <div>{"<0.01 USD$"}</div>
            </div>
        </div>
    </div>
);

export default FeePanel;
