import { cn } from "@/lib/utils";

export interface DotProps {
    /** Size in px (width & height). Defaults to 10. */
    size?: number;
    /** Whether to apply a CSS pulse animation. Defaults to false. */
    pulse?: boolean;
    className?: string;
}

const Dot = ({ size = 13, pulse = false, className }: DotProps) => {
    return (
        <span
            className={cn("inline-block shrink-0 rounded-full", className, pulse && "animate-pulse")}
            style={{ width: size, height: size }}
        />
    );
};

export default Dot;
