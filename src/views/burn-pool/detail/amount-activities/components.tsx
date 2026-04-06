import React from "react";
import { Button } from "@/components/common/glow/button";
import { Button as UIButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GlowContainer from "@/components/common/glow/container";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Container
// ─────────────────────────────────────────────────────────────

export const Container = ({ children }: { children?: React.ReactNode }) => (
    <GlowContainer
        variant="burn"
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
    letter?: string;
    text: string;
    onClick?: () => void;
    color?: string;
    disabled?: boolean;
    isLoading?: boolean;
}) => (
    <Button
        variant="burn"
        hasHover
        isLoading={isLoading}
        disabled={disabled}
        onClick={onClick}
        className="my-2 w-full py-2 font-orbitron text-base md:my-3.25 md:py-3 md:text-lg lg:text-xl 2xl:text-2xl"
    >
        {text}
    </Button>
);

// ─────────────────────────────────────────────────────────────
// StatRow
// ─────────────────────────────────────────────────────────────

export const StatRow = ({
    label,
    value,
    className,
    labelClassName,
    valueClassName = "text-sm font-bold md:text-base lg:text-lg 2xl:text-xl",
}: {
    label: string;
    value: React.ReactNode;
    className?: string;
    labelClassName?: string;
    valueClassName?: string;
}) => (
    <div className={cn("mb-3 flex items-center justify-between", className)}>
        <span className={cn("text-sm md:text-base lg:text-lg 2xl:text-xl", labelClassName)}>{label}</span>
        <span className={valueClassName}>{value}</span>
    </div>
);

// ─────────────────────────────────────────────────────────────
// AmountInput
// ─────────────────────────────────────────────────────────────

export const AmountInput = ({
    open,
    value,
    onChange,
    onConfirm,
    placeholder = "Amount",
}: {
    open: boolean;
    value: string;
    onChange: (v: string) => void;
    onConfirm: () => void;
    placeholder?: string;
}) => {
    if (!open) return null;
    return (
        <div className="flex gap-2">
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && onConfirm()}
            />
            <UIButton size="sm" onClick={onConfirm}>
                OK
            </UIButton>
        </div>
    );
};
