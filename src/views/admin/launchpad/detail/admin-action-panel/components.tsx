import React from "react";
import AnimateIconButton from "@/components/common/animate-icon-button";

// ─────────────────────────────────────────────────────────────
// Container
// ─────────────────────────────────────────────────────────────

export const Container = ({ children }: { children?: React.ReactNode }) => (
  <div className="mt-3 w-full space-y-3 px-6 py-4">
    <span className="flex items-center gap-2 text-xl font-medium">
      Admin Action Panel
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
  isLoading,
  disabled,
}: {
  letter: string;
  text: string;
  onClick?: () => void;
  color?: string;
  isLoading?: boolean;
  disabled?: boolean;
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
  <div className={`flex items-center justify-between ${className}`}>
    <span className="text-sm">{label}</span>
    <span className={valueClassName}>{value}</span>
  </div>
);
