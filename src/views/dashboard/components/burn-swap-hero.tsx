import GlowContainer from "@/components/common/glow/container";
import { Button } from "@/components/common/glow/button";
import {
    IconBurnCategory,
    IconParticipant,
    IconStack,
    IconSwapCategory,
    IconStackY,
    IconStats,
    IconTwoDArrow,
} from "@/assets/react";
import { shortenNumber } from "@/utils/helpers/numbers";
import type { StatsStickerResponse } from "@/services/dashboardService";
import BurnTrackerImage from "/images/dashboard/burn-tracker.png";
import SwapChartStatsImage from "/images/dashboard/swap-stats.png";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import WhitelistTokenSelect, {
    type TokenOption,
} from "@/components/common/glow/whitelist-token-select";
import { DEFAULT_INPUT_NUMBER_STEP } from "@/config/constant";
import TokenDisplay from "@/components/common/token-display";
import { sumTokenAmounts } from "@/utils/shared-functions/calculate";

// ── Shared stat row ────────────────────────────────────────────────────────────

const HeroStatRow = ({
    icon,
    label,
    value,
    valueClass,
}: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    valueClass: string;
}) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
            <div className="flex size-10 items-center justify-center rounded-[6px] bg-mb-btn-burn/10">
                {icon}
            </div>
            <span className="text-base font-medium text-mb-gray-b8 sm:text-xl">
                {label}
            </span>
        </div>
        <div className={`text-base font-medium sm:text-xl ${valueClass}`}>
            {value}
        </div>
    </div>
);

const HeroSwapMiniForm = () => {
    const [tokenFrom, setTokenFrom] = useState<TokenOption>();
    const [tokenTo, setTokenTo] = useState<TokenOption>();
    const [amount, setAmount] = useState("");

    return (
        <div className="flex w-full flex-1 flex-col justify-end font-inter">
            {/* From / To */}
            <div className="mb-2 flex items-center justify-between text-base text-mb-gray-b8/60">
                <span>From</span>
                <span>to</span>
            </div>

            {/* Token Select */}
            <div className="mb-2 flex items-center gap-2 rounded-[6px] border-2 border-[#212C3E] px-3">
                <div className="flex-1">
                    <WhitelistTokenSelect
                        value={tokenFrom}
                        onChange={setTokenFrom}
                        disabledAddress={tokenTo?.address}
                        classNames={{
                            trigger: "w-full",
                        }}
                    />
                </div>

                <IconTwoDArrow />

                <div className="flex-1">
                    <WhitelistTokenSelect
                        value={tokenTo}
                        onChange={setTokenTo}
                        disabledAddress={tokenFrom?.address}
                        classNames={{
                            trigger: "w-full justify-end",
                        }}
                    />
                </div>
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-2">
                <span className="text-base text-mb-gray-b8/60">Amount</span>
                <div className="flex justify-between rounded-[6px] border-2 border-[#212C3E] px-3">
                    <Input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        type="number"
                        step={DEFAULT_INPUT_NUMBER_STEP}
                        placeholder="0.0"
                        className="bg-transparent pl-4"
                    />
                    {tokenTo && (
                        <TokenDisplay
                            symbol={tokenTo.customSymbol ?? tokenTo.symbol}
                            customSymbol={tokenTo.customSymbol ?? tokenTo.symbol}
                            imageUri={tokenTo.imageUri ?? undefined}
                            classNames={{ img: "size-5", container: "space-x-1 text-sm" }}
                        />
                    )}
                </div>
            </div>

            {/* CTA */}
            <Button
                variant="swap"
                size="big"
                hasHover
                className="sm:h-57px sm:w-275px mt-5.5 h-12 w-full font-orbitron"
            >
                Create Pool
            </Button>
        </div>
    );
};

export default HeroSwapMiniForm;

interface Props {
    data?: StatsStickerResponse;
}

export const BurnSwapHero = ({ data }: Props) => {
    const navigate = useNavigate();
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Burn Tracker */}
            <GlowContainer
                className="relative flex flex-col overflow-visible sm:flex-row"
                variant="burn"
            >
                <GlowContainer
                    variant="burn"
                    className="-mx-0.5 -mt-0.5 -mb-0.5 -ml-0.5 flex shrink-0 flex-col gap-8.75 px-5 py-6.25"
                >
                    <div className="flex items-center gap-3">
                        <IconBurnCategory className="size-10.75" />
                        <p className="text-2xl font-medium">BURN TRACKER</p>
                    </div>
                    <img src={BurnTrackerImage} alt="Burn Tracker" />
                    <Button
                        variant="burn"
                        hasHover
                        size="big"
                        className="sm:h-57px sm:w-275px h-12 w-full"
                        onClick={() => {
                            navigate({ to: "/burn" });
                        }}
                    >
                        Start Burn
                    </Button>
                </GlowContainer>
                <div className="mx-5 flex min-w-0 flex-1 flex-col justify-center space-y-2.5 py-4 font-inter sm:mr-5 sm:ml-7 sm:py-0">
                    <div className="flex items-center gap-2">
                        <IconBurnCategory className="size-7.25" />
                        <p className="font-orbitron text-xl font-medium">BURN</p>
                    </div>
                    <p className="font-orbitron text-2xl font-medium text-mb-burn-light uppercase text-burn-glow sm:text-[32px]">
                        {sumTokenAmounts(data?.burnSection?.volume ?? [], true, 2)}
                    </p>
                    <p className="text-base font-medium text-mb-gray-b8/60">
                        Total Burned Volume
                    </p>
                    <HeroStatRow
                        icon={<IconStack />}
                        label="Total Transactions"
                        value={shortenNumber({ number: data?.burnSection?.totalTxns ?? 0 })}
                        valueClass="text-mb-burn-light"
                    />
                    <HeroStatRow
                        icon={<IconStack />}
                        label="Total Pools"
                        value={shortenNumber({
                            number: data?.burnSection?.totalPools ?? 0,
                        })}
                        valueClass="text-mb-burn-light"
                    />
                    <HeroStatRow
                        icon={<IconParticipant className="text-mb-burn-light" />}
                        label="Total Participants"
                        value={shortenNumber({
                            number: data?.burnSection?.totalParticipants ?? 0,
                        })}
                        valueClass="text-mb-burn-light"
                    />
                </div>
            </GlowContainer>

            {/* Token Swap */}
            <GlowContainer
                className="relative flex flex-col overflow-visible sm:flex-row-reverse"
                variant="swap"
            >
                <GlowContainer
                    variant="swap"
                    className="-mx-0.5 -mt-0.5 -mb-0.5 -ml-0.5 flex max-w-19/40 shrink-0 flex-col gap-8.75 px-5 py-6.25"
                >
                    <div className="flex items-center gap-3">
                        <IconSwapCategory className="size-10.75" />
                        <p className="text-2xl font-medium">TOKEN SWAP</p>
                    </div>
                    <HeroSwapMiniForm />
                </GlowContainer>
                <div className="mx-5 flex min-w-0 flex-1 flex-col justify-center space-y-2.5 py-4 font-inter sm:mr-7 sm:ml-5 sm:py-0">
                    <div className="flex items-center gap-2">
                        <IconSwapCategory className="size-7.25" />
                        <p className="font-orbitron text-xl font-medium">SWAP</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-2.5">
                            <p className="font-orbitron text-2xl font-medium text-mb-swap-light uppercase text-swap-glow sm:text-[32px]">
                                {sumTokenAmounts(data?.swapSection?.volume ?? [], true, 2)}
                            </p>
                            <p className="text-base font-medium text-mb-gray-b8/60">
                                Total Swap Volume
                            </p>
                        </div>
                        <img src={SwapChartStatsImage} alt="Swap Stats" />
                    </div>
                    <HeroStatRow
                        icon={<IconStats />}
                        label="Total Transactions"
                        value={shortenNumber({ number: data?.swapSection?.totalTxns ?? 0 })}
                        valueClass="text-mb-swap-light"
                    />
                    <HeroStatRow
                        icon={<IconStackY />}
                        label="Total Pools"
                        value={shortenNumber({
                            number: data?.swapSection?.totalPools ?? 0,
                        })}
                        valueClass="text-mb-swap-light"
                    />
                    <HeroStatRow
                        icon={<IconParticipant className="text-mb-swap-light" />}
                        label="Total Participants"
                        value={shortenNumber({
                            number: data?.swapSection?.totalParticipants ?? 0,
                        })}
                        valueClass="text-mb-swap-light"
                    />
                </div>
            </GlowContainer>
        </div>
    );
};
