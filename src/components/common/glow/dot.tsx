import { cn } from "@/lib/utils";

export interface DotProps {
    /** Whether to apply a CSS pulse animation. Defaults to false. */
    pulse?: boolean;
    className?: string;
}

const Dot = ({ pulse = false, className }: DotProps) => {
    return (
        <span
            className={cn("inline-block shrink-0 rounded-full", className, pulse && "animate-pulse")}
        />
    );
};

export default Dot;
