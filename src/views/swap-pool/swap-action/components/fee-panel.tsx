import InfoTooltip from "@/components/common/glow/info-tooltip";


type Props = {
    open: boolean;
    settlementFee?: string | number | null;
};

const FeePanel = ({ open, settlementFee }: Props) => (
    <div
        className={`overflow-hidden transition-all w-[calc(100%-2rem)] sm:w-lg duration-300 font-inter ${
            open ? "mt-2 max-h-40 opacity-100" : "max-h-0 opacity-0"
        }`}
    >
        <div className="w-full rounded-xl border-2 border-swap-border bg-mb-dark-popover-item p-4.5">
            <div className="flex items-center justify-between text-sm text-foreground">
                <div className="flex items-center gap-1.5">
                    Fee:
                    <InfoTooltip content="Settlement fee charged per swap" />
                </div>
                <div className="font-semibold text-green-500">
                    {settlementFee ? `${Number(settlementFee) / 100}%` : "Free"}
                </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-foreground">
                <div className="flex items-center gap-1.5">
                    Network Fee:
                    <InfoTooltip content="Estimated gas fee for the transaction" />
                </div>
                <div>{"<0.01 USD$"}</div>
            </div>
        </div>
    </div>
);

export default FeePanel;
