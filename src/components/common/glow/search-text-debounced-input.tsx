import { useEffect, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../../ui/input-group";
import { useDebounceValue } from "usehooks-ts";
import { SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getVariantBorderClassName, type ContainerVariant } from "./container";

interface Props {
  variant: ContainerVariant;
  inputProps?: Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange"
  >;
  value?: string;
  onValueChange?: (value: string) => void;
  debounceTime?: number;
  addons?: React.ReactNode;
  className?: string;
}

const SearchTextDebouncedInput: React.FC<Props> = ({
  variant,
  inputProps,
  value,
  onValueChange,
  debounceTime = 500,
  addons = (
    <InputGroupAddon align={"inline-start"}>
      <SearchIcon className="size-5 md:size-7" />
    </InputGroupAddon>
  ),
  className,
}) => {
  const [localValue, setLocalValue] = useState(value ?? "");
  const [debouncedValue] = useDebounceValue(localValue, debounceTime);

  useEffect(() => {
    if (value === undefined) {
      return;
    }
    if (localValue !== value) {
      setLocalValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (debouncedValue !== value) {
      onValueChange?.(debouncedValue);
    }
  }, [debouncedValue]);

  return (
    <InputGroup
      className={cn(
        "h-auto bg-transparent md:py-2",
        getVariantBorderClassName({ variant, custom: "rounded-md border-2" }),
        className,
      )}
    >
      <InputGroupInput
        {...inputProps}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="font-inter text-base placeholder:text-base md:text-28px placeholder:md:text-28px"
      />
      {addons}
    </InputGroup>
  );
};

export default SearchTextDebouncedInput;
