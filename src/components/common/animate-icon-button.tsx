import { cn } from "@/lib/utils";
import LetterIcon from "./letter-icon";

interface Props {
  textVariant?: "text-left" | "text-container-center" | "text-self-center";
  classNames?: {
    btn?: string;
    text?: string;
    icon?: string;
  };
  hasGroupHover?: boolean;
  iconLetter: string;
  text?: string;
  color?: string;
}

const AnimateIconButton: React.FC<Props> = ({
  textVariant,
  classNames,
  hasGroupHover,
  iconLetter,
  text,
  color,
}) => {
  return (
    <button
      style={
        {
          "--btn-bg": color,
        } as React.CSSProperties
      }
      type="button"
      className={cn(
        "group flex items-center gap-1.75 rounded-sm border border-inactive px-1.25 py-2 text-foreground transition-all duration-400 **:transition-all **:duration-400",
        "relative overflow-hidden after:absolute after:top-0 after:left-full after:h-full after:w-full after:rounded-sm",
        "after:bg-(--btn-bg) after:content-['']",
        "after:transition-all after:duration-400",
        "hover:border-transparent hover:after:left-0",
        { "justify-center": textVariant === "text-container-center" },
        {
          "group-hover:border-transparent group-hover:after:left-0":
            hasGroupHover,
        },
        classNames?.btn,
      )}
    >
      <LetterIcon
        letter={iconLetter}
        className={cn("relative z-10 bg-(--btn-bg) group-hover:text-(--btn-bg)", classNames?.icon)}
      />
      <span
        className={cn(
          "relative z-10 text-base font-normal",
          classNames?.text,
          {
            "text-center":
              textVariant === "text-container-center" ||
              textVariant === "text-self-center",
          },
          { "flex-1": textVariant === "text-self-center" },
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
