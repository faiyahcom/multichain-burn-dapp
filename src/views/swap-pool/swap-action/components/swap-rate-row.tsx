import { ArrowIcon } from "@/components/common/arrow-icon";

type Props = {
    burnSymbol?: string;
    rewardSymbol?: string;
    rewardNumerator?: string | number;
    rewardDenominator?: string | number;
    onToggle: () => void;
};

const SwapRateRow = ({
    burnSymbol,
    rewardSymbol,
    rewardNumerator,
    rewardDenominator,
    onToggle,
}: Props) => (
    <div className="mt-4 mb-2 flex w-full cursor-pointer items-center justify-between rounded-18px bg-white py-2 pr-3 pl-11 transition-all duration-300">
        <p className="font-inter text-sm font-medium text-mb-btn-swap/85">
            {`1 ${burnSymbol} = ${Number(rewardNumerator) / Number(rewardDenominator)} ${rewardSymbol}`}
        </p>
        <ArrowIcon className="rotate-90 text-mb-btn-swap/85" onClick={onToggle} />
    </div>
);

export default SwapRateRow;
