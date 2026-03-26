import { NETWORK_CONFIGS } from "@/config/networks";
import type { MultipleSelectOption } from "./multiple-select";
import NetworkImgIcon from "../network-img-icon";
import MultipleSelect from "./multiple-select";
import type { ContainerVariant } from "./container";

interface Props {
  selected?: string[];
  onChange?: (value: string[]) => void;
  otherProps?: Omit<
    React.ComponentProps<typeof MultipleSelect>,
    | "options"
    | "placeholder"
    | "selected"
    | "onChange"
    | "defaultValuesWhenUncheckAll"
    | "variant"
  >;
  variant: ContainerVariant;
}

const NetworkMultipleSelect: React.FC<Props> = ({
  selected,
  onChange,
  otherProps,
  variant,
}) => {
  const networkOptions: MultipleSelectOption[] = NETWORK_CONFIGS.map(
    (network) => ({
      label: network.label,
      value: network.id,
      icon: ({ className }: { className?: string }) => (
        <NetworkImgIcon
          src={network.iconSrc}
          className={className}
          alt={network.label}
        />
      ),
    }),
  );

  return (
    <MultipleSelect
      variant={variant}
      options={networkOptions}
      placeholder="Network"
      selected={selected}
      onChange={onChange}
      defaultValuesWhenUncheckAll={
        NETWORK_CONFIGS.length > 0 ? [NETWORK_CONFIGS[0].id] : []
      }
      {...otherProps}
    />
  );
};

export default NetworkMultipleSelect;
