import { Link, useLocation } from "@tanstack/react-router";
import { NAV_ITEMS } from "./const";
import { cn } from "@/lib/utils";

const HeaderNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  return (
    <nav className="flex items-center gap-7.5 xl:gap-15">
      {NAV_ITEMS.map((item, index) => {
        const isActive =
          item.activeRegexMatch && currentPath.match(item.activeRegexMatch);
        return (
          <Link
            to={item.href}
            key={index}
            className={cn(
              "flex items-center justify-center border-y-[3px] border-transparent py-2.5 font-medium text-mb-gray-b8",
              "transition-all duration-300",
              "hover:border-b-foreground hover:font-bold hover:text-foreground",
              { "border-b-foreground font-bold text-foreground": isActive },
            )}
          >
            <p className="text-xl xl:text-40px">{item.title}</p>
          </Link>
        );
      })}
    </nav>
  );
};

export default HeaderNav;
