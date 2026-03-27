import { Button } from "@/components/common/glow/button";
import GlowContainer from "@/components/common/glow/container";
import TokenListGlow from "@/components/common/glow/token-list";
import type { WhitelistToken } from "@/services/whitelistService";
import { PoolKindCodeEnum, type PoolKindCode } from "@/types/pool";
import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import PoolListGlowSummary from "./summary";
import { getPoolGlowVariant } from "./helpers";

interface PoolGlowSectionProps {
    title: string;
    poolKind: PoolKindCode;
    children: ReactNode;
    className?: string;
}

export const PoolGlowSection = ({
    title,
    poolKind,
    children,
    className = "px-5 py-6",
}: PoolGlowSectionProps) => {
    const variant = getPoolGlowVariant(poolKind);

    return (
        <div className="space-y-3.75">
            <p className="text-28px font-semibold">{title}</p>
            <GlowContainer variant={variant} className={className}>
                {children}
            </GlowContainer>
        </div>
    );
};

interface PoolGlowPageLayoutProps {
    poolKind: PoolKindCode;
    recentSection: ReactNode;
    poolSection?: ReactNode;
    onTokenClick?: (token: WhitelistToken) => void;
}

const PoolGlowPageLayout = ({
    poolKind,
    recentSection,
    poolSection,
    onTokenClick,
}: PoolGlowPageLayoutProps) => {
    const navigate = useNavigate();
    const variant = getPoolGlowVariant(poolKind);

    const createLabel =
        poolKind === PoolKindCodeEnum.Burn
            ? "Create Burn Pool"
            : "Create Swap Pool";
    const createTo =
        poolKind === PoolKindCodeEnum.Burn ? "/burn/create" : "/swap/create";

    return (
        <div className="w-full space-y-4 xl:space-y-8">
            <PoolListGlowSummary poolKind={poolKind} />
            <div className="flex w-full justify-end">
                <Button
                    variant={variant}
                    className="px-14 text-22px font-bold"
                    onClick={() => navigate({ to: createTo })}
                >
                    {createLabel}
                </Button>
            </div>
            {recentSection}
            {poolSection}
            <TokenListGlow variant={variant} onTokenClick={onTokenClick} />
        </div>
    );
};

export default PoolGlowPageLayout;
