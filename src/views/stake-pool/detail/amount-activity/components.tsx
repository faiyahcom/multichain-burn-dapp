import React from "react";
import { Button } from "@/components/common/glow/button";
import GlowContainer from "@/components/common/glow/container";

// ─────────────────────────────────────────────────────────────
// Container
// ─────────────────────────────────────────────────────────────

export const Container = ({ children }: { children?: React.ReactNode }) => (
    <GlowContainer
        variant="stake"
        className="w-full space-y-3 px-3 py-4 font-inter md:px-5 md:py-6"
    >
        <p className="font-orbitron text-base font-semibold md:text-xl lg:text-2xl 2xl:text-28px">
            Amount & Activity
        </p>
        {children}
    </GlowContainer>
);

// ─────────────────────────────────────────────────────────────
// ActionBtn
// ─────────────────────────────────────────────────────────────

export const ActionBtn = ({
    text,
    onClick,
    disabled,
    isLoading,
}: {
    text: string;
    onClick?: () => void;
    disabled?: boolean;
    isLoading?: boolean;
}) => (
    <Button
        variant="stake"
        hasHover
        isLoading={isLoading}
        disabled={disabled}
        onClick={onClick}
        className="my-1.5 w-full py-2 font-orbitron text-base md:my-3 md:py-3 md:text-lg lg:text-xl 2xl:text-2xl"
    >
        {text}
    </Button>
);