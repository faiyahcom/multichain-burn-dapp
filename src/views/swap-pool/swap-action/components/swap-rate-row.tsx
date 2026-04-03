import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
    burnSymbol?: string;
    rewardSymbol?: string;
    rewardNumerator?: string | number;
    rewardDenominator?: string | number;
    open?: boolean;
    onToggle: () => void;
};

const SwapRateRow = ({
    burnSymbol,
    rewardSymbol,
    rewardNumerator,
    rewardDenominator,
    open,
    onToggle,
}: Props) => (
    <div
        className="mt-4 mb-2 flex w-full cursor-pointer items-center justify-between rounded-18px bg-white py-2 pr-3 pl-11 transition-all duration-300"
        onClick={onToggle}
    >
        <p className="font-inter text-sm font-medium text-mb-btn-swap/85">
            {`1 ${burnSymbol} = ${Number(rewardNumerator) / Number(rewardDenominator)} ${rewardSymbol}`}
        </p>
        <ChevronDownIcon className={cn("size-4 text-mb-btn-swap/85 transition-transform duration-300", open && "rotate-180")} />
    </div>
);

export default SwapRateRow;
