type Props = {
    open: boolean;
    settlementFee?: string | number | null;
};

const FeePanel = ({ open, settlementFee }: Props) => (
    <div
        className={`fixed transition-all duration-300 ${
            open ? "mt-3 max-h-40 opacity-100" : "max-h-0 opacity-0"
        }`}
    >
        <div className="w-full rounded-2xl bg-mb-gray px-6 py-5">
            <div className="flex justify-between text-lg text-greyed">
                <div className="flex items-center gap-1">
                    Fee:
                    <span className="text-sm opacity-60">ⓘ</span>
                </div>
                <div className="font-medium text-green-500">
                    {settlementFee ? `${Number(settlementFee) / 100}%` : "Free"}
                </div>
            </div>

            <div className="mt-4 flex justify-between text-lg text-greyed">
                <div className="flex items-center gap-1">
                    Network Fee:
                    <span className="text-sm opacity-60">ⓘ</span>
                </div>
                <div>{"<0.01 USD$"}</div>
            </div>
        </div>
    </div>
);

export default FeePanel;
