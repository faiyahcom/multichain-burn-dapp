import { cn } from "@/lib/utils";

interface Props {
  letter: string;
  className?: string;
}

const LetterIcon: React.FC<Props> = ({ letter, className }) => {
  return (
    <span
      className={cn(
        "inline-flex size-5.5 shrink-0 items-center justify-center rounded-full text-15px leading-0 font-extrabold text-primary-foreground",
        className,
      )}
    >
      {letter}
    </span>
  );
};

export default LetterIcon;
