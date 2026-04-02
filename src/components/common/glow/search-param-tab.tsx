import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";

export interface SearchParamTabOption<T extends string = string> {
  label: string;
  value: T;
}

export interface Props {
  options: SearchParamTabOption[];
  searchParamKey: string;
  currentValue: string;
}

const SearchParamTab: React.FC<Props> = ({
  options,
  searchParamKey,
  currentValue,
}) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div
      className="flex items-center gap-7.5 overflow-x-auto sm:gap-16.25"
      style={{
        scrollbarWidth: "none",
      }}
    >
      {options.map((option) => {
        const isActive = option.value === currentValue;
        return (
          <Link
            key={option.value}
            to={currentPath}
            search={{
              [searchParamKey]: option.value,
            }}
            className={cn(
              "border-b-3 border-transparent py-1.25 text-xl font-bold text-mb-gray-b8 sm:py-2.5 sm:text-2xl",
              "transition-colors duration-300",
              { "border-foreground text-foreground": isActive },
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
};

export default SearchParamTab;
