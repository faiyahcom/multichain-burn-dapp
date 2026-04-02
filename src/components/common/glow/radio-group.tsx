import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";
import type { ContainerVariant } from "./container";
import {
    getVariantBorderClassName,
    getVariantActiveBgGradientClassName,
    getVariantBtnBgClassName,
} from "./container";

// ── Context ───────────────────────────────────────────────────────────────────
interface RadioGroupContextValue {
    variant: ContainerVariant;
    value?: string;
}
const RadioGroupContext = React.createContext<RadioGroupContextValue>({
    variant: "swap",
});

// ── RadioGroup ────────────────────────────────────────────────────────────────
interface RadioGroupProps extends React.ComponentProps<
    typeof RadioGroupPrimitive.Root
> {
    variant?: ContainerVariant;
}

function RadioGroup({
    className,
    variant = "swap",
    value,
    defaultValue,
    onValueChange,
    ...props
}: RadioGroupProps) {
    const [internalValue, setInternalValue] = React.useState<string | undefined>(
        defaultValue,
    );
    const currentValue = value !== undefined ? value : internalValue;

    const handleValueChange = React.useCallback(
        (v: string) => {
            if (value === undefined) setInternalValue(v);
            onValueChange?.(v);
        },
        [value, onValueChange],
    );

    const contextValue = React.useMemo(
        () => ({ variant, value: currentValue }),
        [variant, currentValue],
    );

    return (
        <RadioGroupContext.Provider value={contextValue}>
            <RadioGroupPrimitive.Root
                value={value}
                defaultValue={defaultValue}
                onValueChange={handleValueChange}
                className={cn(
                    "inline-flex items-center bg-mb-dark-popover-item p-1",
                    getVariantBorderClassName({ variant, custom: "rounded-xl" }),
                    className,
                )}
                {...props}
            />
        </RadioGroupContext.Provider>
    );
}

// ── RadioGroupItem ────────────────────────────────────────────────────────────
function RadioGroupItem({
    className,
    children,
    value,
    ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> & {
    children: React.ReactNode;
}) {
    const { variant, value: currentValue } = React.useContext(RadioGroupContext);
    const isChecked = !!value && currentValue === value;

    return (
        <RadioGroupPrimitive.Item
            value={value ?? ""}
            className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2",
                "font-inter text-[23px] font-medium transition-all duration-200",
                "cursor-pointer outline-none focus-visible:outline-none",
                // Inactive: transparent border, dimmed text
                "border border-transparent text-foreground/50",
                // Active: variant border + gradient bg + full text
                isChecked &&
                getVariantBorderClassName({ variant, custom: "rounded-lg" }),
                isChecked && getVariantActiveBgGradientClassName({ variant }),
                isChecked && "text-foreground",
                className,
            )}
            {...props}
        >
            {/* Radio circle — solid variant fill + white border ring when checked */}
            <span
                className={cn(
                    "hidden size-4 shrink-0 items-center justify-center rounded-full border-2",
                    "group-data-[state=checked]:flex",
                    getVariantBorderClassName({ variant, custom: "rounded-full" }),
                    isChecked
                        ? cn("border-white", getVariantBtnBgClassName({ variant }))
                        : "border-foreground/30",
                )}
            >
                <RadioGroupPrimitive.Indicator />
            </span>

            {children}
        </RadioGroupPrimitive.Item>
    );
}

export { RadioGroup, RadioGroupItem };
