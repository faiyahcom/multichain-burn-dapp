import { cn } from "@/lib/utils";

interface Props {
  letter: string;
  className?: string;
  color?: string;
}

const LetterIcon: React.FC<Props> = ({ letter, className, color }) => {
  return (
    <span
      style={
        {
          "--color": color,
        } as React.CSSProperties
      }
      className={cn(
        "inline-flex size-5.5 shrink-0 items-center justify-center rounded-full text-15px leading-0 font-extrabold text-primary-foreground",
        { "bg-(--color)": !!color },
        className,
      )}
    >
      {letter}
    </span>
  );
};

export default LetterIcon;
