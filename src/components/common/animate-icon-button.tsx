import { cn } from "@/lib/utils";
import LetterIcon from "./letter-icon";

interface BaseProps {
  textVariant?: "text-left" | "text-container-center" | "text-self-center";
  classNames?: {
    btn?: string;
    text?: string;
    icon?: string;
  };
  hasGroupHover?: boolean;
  text?: string;
  afterText?: string; // Only use if the after text is different from the text
  color?: string;
  isActive?: boolean;
  btnProps?: Omit<React.ComponentProps<"button">, "className" | "style">;
}

interface LetterIconVariantProps extends BaseProps {
  variant?: "letter-icon";
  iconLetter: string;
}

interface ExternalIconVariantProps extends BaseProps {
  variant?: "external-icon";
  icon: React.ComponentType<{ className?: string }>;
}

type Props = LetterIconVariantProps | ExternalIconVariantProps;

const AnimateIconButton: React.FC<Props> = (props) => {
  const {
    textVariant,
    classNames,
    hasGroupHover,
    text,
    afterText,
    color,
    isActive,
    btnProps,
  } = props;

  const resolveIcon = () => {
    switch (props.variant ?? "letter-icon") {
      case "letter-icon":
        return (
          <LetterIcon
            letter={(props as LetterIconVariantProps).iconLetter}
            className={cn("size-5.5 bg-(--btn-bg)", classNames?.icon)}
          />
        );
      case "external-icon":
        const Icon = (props as ExternalIconVariantProps).icon;
        return <Icon className={cn("size-5.5", classNames?.icon)} />;
      default:
        return null;
    }
  };

  return (
    <button
      style={
        {
          "--btn-bg": color,
          "--btn-text": text ? `'${text.replace(/'/g, "\\'")}'` : "''",
          "--btn-after-text": afterText
            ? `'${afterText.replace(/'/g, "\\'")}'`
            : "''",
        } as React.CSSProperties
      }
      type="button"
      className={cn(
        "flex items-center gap-1.75 rounded-sm border border-inactive px-1.25 py-2 text-foreground transition-all duration-300 **:transition-all **:duration-300",
        "relative overflow-hidden after:absolute after:top-0 after:left-full after:flex after:h-full after:w-full after:items-center after:justify-center after:rounded-sm",
        "after:bg-(--btn-bg) after:text-base after:font-medium after:text-foreground after:content-(--btn-text)",
        "after:transition-all after:duration-300",
        "hover:border-(--btn-bg) hover:after:left-0",
        { "justify-center": textVariant === "text-container-center" },
        {
          "group-hover:border-(--btn-bg) group-hover:after:left-0":
            hasGroupHover,
        },
        {
          "border-(--btn-bg) after:left-0": isActive,
        },
        {
          "after:content-(--btn-after-text)": afterText,
        },
        classNames?.btn,
      )}
      {...btnProps}
    >
      {resolveIcon()}
      <span
        className={cn(
          "text-base font-normal",
          {
            "flex-1 text-center":
              textVariant === "text-container-center" ||
              textVariant === "text-self-center",
          },
          classNames?.text,
        )}
      >
        {text}
      </span>
      {textVariant === "text-container-center" && (
        <div className="size-5.5 shrink-0" />
      )}
    </button>
  );
};

export default AnimateIconButton;
