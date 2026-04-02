import React from "react";
import AnimateIconButton from "@/components/common/animate-icon-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GlowContainer from "@/components/common/glow/container";

// ─────────────────────────────────────────────────────────────
// Container
// ─────────────────────────────────────────────────────────────

export const Container = ({ children }: { children?: React.ReactNode }) => (
    <GlowContainer variant="burn" className="w-full space-y-3 px-3 py-4 font-inter md:px-5 md:py-6">
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
    letter,
    text,
    onClick,
    color = "#966EFF",
    disabled,
    isLoading,
}: {
    letter: string;
    text: string;
    onClick?: () => void;
    color?: string;
    disabled?: boolean;
    isLoading?: boolean;
}) => (
    <AnimateIconButton
        iconLetter={letter}
        text={text}
        variant="letter-icon"
        textVariant="text-container-center"
        hasGroupHover
        classNames={{
            btn: `w-full text-center after:text-sm after:font-medium`,
            text: "text-sm font-medium",
            icon: "size-6",
        }}
        color={color}
        isLoading={isLoading}
        btnProps={{ onClick, disabled }}
    />
);

// ─────────────────────────────────────────────────────────────
// StatRow
// ─────────────────────────────────────────────────────────────

export const StatRow = ({
    label,
    value,
    className = "text-greyed",
    valueClassName = "text-sm",
}: {
    label: string;
    value: React.ReactNode;
    className?: string;
    valueClassName?: string;
}) => (
    <div className={`flex items-center justify-between gap-0.5 ${className}`}>
        <span className="text-sm md:text-base lg:text-lg 2xl:text-xl">{label}</span>
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
            <Button size="sm" onClick={onConfirm}>
                OK
            </Button>
        </div>
    );
};
