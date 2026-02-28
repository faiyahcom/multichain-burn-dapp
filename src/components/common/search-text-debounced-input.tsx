import { useEffect, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { useDebounceValue } from "usehooks-ts";
import { SearchIcon } from "lucide-react";

interface Props {
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
  inputProps,
  value,
  onValueChange,
  debounceTime = 500,
  addons = (
    <InputGroupAddon align={"inline-start"}>
      <SearchIcon />
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
    <InputGroup className={className}>
      <InputGroupInput
        {...inputProps}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
      />
      {addons}
    </InputGroup>
  );
};

export default SearchTextDebouncedInput;
