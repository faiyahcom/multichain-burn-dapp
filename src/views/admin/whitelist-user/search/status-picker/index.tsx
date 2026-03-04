import { cn } from "@/lib/utils";

interface Props {
    options?: { label: string; value: string }[];
    counts?: number[];
    selected?: string;
    onChange?: (value: string) => void;
}

const AdminWhitelistUserSearchStatusPicker: React.FC<Props> = ({
    options,
    counts,
    selected,
    onChange,
}) => {
    const hasCounts = counts && counts.length > 0;

    return (
        <div className="flex items-center gap-2">
            {options?.map((option, index) => {
                const isActive = option?.value === selected;
                return (
                    <button
                        key={index}
                        className={cn(
                            "flex items-center gap-2.25 rounded-md-plus bg-inactive p-0.75 pl-4.25 transition-all",
                            { "bg-active": isActive },
                            { "pr-4.25": !hasCounts },
                        )}
                        onClick={() => onChange?.(option?.value)}
                    >
                        <span
                            className={cn("text-xs font-medium transition-all", {
                                "text-sm font-bold text-primary-foreground": isActive,
                            })}
                        >
                            {option?.label}
                        </span>
                        {hasCounts && (
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-foreground">
                                <span className="text-xs font-medium">
                                    {counts?.[index] ?? 0}
                                </span>
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default AdminWhitelistUserSearchStatusPicker;
