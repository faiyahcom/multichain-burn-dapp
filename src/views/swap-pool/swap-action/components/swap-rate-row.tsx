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
    <div className="mt-2.5 flex w-full cursor-pointer justify-between rounded-2xl bg-white px-4 text-base transition-all duration-300 hover:bg-inactive">
        <p>{`1 ${burnSymbol} = ${Number(rewardNumerator) / Number(rewardDenominator)} ${rewardSymbol}`}</p>
        <ArrowIcon className="rotate-90" onClick={onToggle} />
    </div>
);

export default SwapRateRow;
