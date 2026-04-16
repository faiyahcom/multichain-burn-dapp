import { cn } from "@/lib/utils";
import LetterIcon from "./letter-icon";
import { IconSpinner } from "@/assets/react";

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
  isLoading?: boolean; // Show loading state, disable the button
  isLoadingText?: string; // If not provided, will default to "Confirming…"
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
    isLoading,
    isLoadingText = "Confirming…",
  } = props;

  const isDisabled = isLoading || btnProps?.disabled;

  const resolveIcon = () => {
    if (isDisabled) {
      if (isLoading) {
        return (
          <IconSpinner
            className={cn("size-5.5 animate-spin", classNames?.icon)}
          />
        );
      }
      return null;
    }

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
        { "hover:border-(--btn-bg) hover:after:left-0": !isDisabled },
        { "justify-center": textVariant === "text-container-center" },
        {
          "group-hover:border-(--btn-bg) group-hover:after:left-0":
            hasGroupHover && !isDisabled,
        },
        {
          "border-(--btn-bg) after:left-0": isActive && !isDisabled,
        },
        {
          "after:content-(--btn-after-text)": afterText,
        },
        {
          "justify-center gap-4 border-mb-btn-loading! bg-mb-btn-loading! after:hidden":
            isDisabled,
        },
        classNames?.btn,
      )}
      {...btnProps}
      disabled={isDisabled}
    >
      {resolveIcon()}
      <span
        className={cn(
          "text-base font-normal",
          {
            "text-center":
              textVariant === "text-container-center" ||
              textVariant === "text-self-center",
          },
          {
            "flex-1": !isDisabled
          },
          {
            "font-medium text-primary-foreground": isDisabled,
          },
          classNames?.text,
        )}
      >
        {!isLoading ? text : isLoadingText}
      </span>
      {textVariant === "text-container-center" && !isDisabled && (
        <div className="size-5.5 shrink-0" />
      )}
    </button>
  );
};

export default AnimateIconButton;
