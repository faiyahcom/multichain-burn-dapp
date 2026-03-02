import { cn } from "@/lib/utils";
import LetterIcon from "./letter-icon";

interface Props {
  textVariant?: "text-left" | "text-container-center" | "text-self-center";
  classNames?: {
    btn?: string;
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
          "--btn-text": text ? `'${text.replace(/'/g, "\\'")}'` : "''",
        } as React.CSSProperties
      }
      type="button"
      className={cn(
        "flex items-center gap-1.75 rounded-sm border border-inactive px-1.25 py-2 text-foreground transition-all duration-300 **:transition-all **:duration-300",
        "relative overflow-hidden after:absolute after:top-0 after:left-full after:flex after:h-full after:w-full after:items-center after:justify-center after:rounded-sm",
        "after:bg-(--btn-bg) after:text-base after:font-medium after:text-foreground after:content-(--btn-text)",
        "after:transition-all after:duration-300",
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
        className={cn("size-5.5 bg-(--btn-bg)")}
      />
      <span
        className={cn(
          "text-base font-normal",
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
