import React from "react";
import AnimateIconButton from "@/components/common/animate-icon-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─────────────────────────────────────────────────────────────
// Container
// ─────────────────────────────────────────────────────────────

export const Container = ({ children }: { children?: React.ReactNode }) => (
    <div className="mt-3 w-full space-y-3 px-6 py-4">
        <span className="flex items-center gap-2 text-xl font-medium">
            Amount & Activity
        </span>
        {children}
    </div>
);

// ─────────────────────────────────────────────────────────────
// ActionBtn
// ─────────────────────────────────────────────────────────────

export const ActionBtn = ({
    letter,
    text,
    onClick,
    color = "#966EFF",
}: {
    letter: string;
    text: string;
    onClick?: () => void;
    color?: string;
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
        btnProps={{ onClick }}
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
    <div className={`flex items-center justify-between ${className}`}>
        <span className="text-sm">{label}</span>
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
