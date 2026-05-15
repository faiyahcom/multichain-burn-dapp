import { cn } from "@/lib/utils";

export interface AdminHomeSummaryCardProps {
  title?: string;
  value?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const AdminHomeSummaryCard: React.FC<AdminHomeSummaryCardProps> = ({
  title,
  value,
  icon,
}) => {
  const Icon = icon;
  return (
    <div
      className={cn(
        "rounded-14px border border-mb-gray-e5 bg-primary-foreground",
        "space-y-4 p-3 sm:space-y-8 sm:px-6 sm:py-6.25",
      )}
      style={{
        boxShadow:
          "0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="flex items-center justify-between gap-1 text-[#6B7280]">
        <p className="text-base font-medium">{title}</p>
        {Icon && <Icon className="w-4" />}
      </div>

      <p className="text-[30px] font-bold text-[#0a0a0a]">{value}</p>
    </div>
  );
};

export default AdminHomeSummaryCard;
