import * as React from "react";
import {
    NumericFormat,
    type InputAttributes,
    type NumericFormatProps,
} from "react-number-format";
import { Input } from "@/components/ui/input";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NumericInputProps = Omit<
    React.ComponentProps<"input">,
    "onChange" | "type" | "step"
> & {
    decimalScale?: number;
    /** Called with the raw numeric string (no thousand separators) on user input. */
    onChange?: (value: string) => void;
    /** Override the underlying input component (e.g. the glow Input). Defaults to the ui Input. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inputComponent?: React.ComponentType<any>;
    // allow extra props like `variant` to flow through to inputComponent
    [key: string]: unknown;
};

/**
 * A formatting wrapper around NumericFormat. Designed to be used with
 * react-hook-form's Controller (recommended) or as a standalone controlled input.
 *
 * Usage with Controller:
 *   <Controller control={control} name="amount" render={({ field }) => (
 *     <NumericInput value={field.value} onChange={field.onChange} ref={field.ref} />
 *   )} />
 *
 * Usage with glow Input:
 *   <NumericInput inputComponent={GlowInput} variant="burn" value={...} onChange={...} />
 */
const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
    ({ onChange, decimalScale = 6, inputComponent = Input, ...props }, ref) => {
        return (
            <NumericFormat
                {...(props as NumericFormatProps)}
                getInputRef={ref}
                customInput={
                    inputComponent as React.ComponentType<InputAttributes> | undefined
                }
                thousandSeparator=","
                decimalSeparator="."
                allowNegative={false}
                decimalScale={decimalScale as number}
                onValueChange={(values, sourceInfo) => {
                    if (sourceInfo.source === "event") {
                        onChange?.(values.value);
                    }
                }}
            />
        );
    },
);

NumericInput.displayName = "NumericInput";

export { NumericInput };
