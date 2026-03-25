import clsx from "clsx";

export interface StatBoxProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    valueClassName?: string;
    onClick?: () => void;
}

const StatBox = ({ label, icon, value, valueClassName, onClick }: StatBoxProps) => (
    <div
        className="cursor-pointer rounded-md border border-inactive bg-white px-5 py-4 transition-shadow hover:shadow-md dark:bg-card"
        onClick={onClick}
    >
        <div className="mb-3 flex items-center gap-2.5">
            {icon}
            <span className="text-15px text-foreground">{label}</span>
        </div>
        <p className={clsx("text-2xl font-bold", valueClassName ?? "text-foreground")}>
            {value}
        </p>
    </div>
);

export default StatBox;
