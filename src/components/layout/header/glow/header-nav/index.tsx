import { Link, useLocation } from "@tanstack/react-router";
import { NAV_ITEMS } from "./const";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MenuIcon } from "lucide-react";

export const HeaderNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  return (
    <nav className="hidden items-center gap-7 xl:flex">
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
            <p className="text-xl">{item.title}</p>
          </Link>
        );
      })}
    </nav>
  );
};

export const HeaderNavMobile = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Sheet>
      <SheetTrigger className="xl:hidden">
        <MenuIcon />
      </SheetTrigger>
      <SheetContent className="xl:hidden" side="left" showCloseButton={false}>
        <SheetHeader>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Navigation</SheetDescription>
        </SheetHeader>
        {NAV_ITEMS.map((item, index) => {
          const isActive =
            item.activeRegexMatch && currentPath.match(item.activeRegexMatch);
          return (
            <SheetClose key={index} asChild>
              <Link
                to={item.href}
                className={cn(
                  "mx-auto flex w-max items-center justify-center border-y-[3px] border-transparent py-2.5 font-medium text-mb-gray-b8",
                  "transition-all duration-300",
                  "hover:border-b-foreground hover:font-bold hover:text-foreground",
                  { "border-b-foreground font-bold text-foreground": isActive },
                )}
              >
                <p className="text-xl">{item.title}</p>
              </Link>
            </SheetClose>
          );
        })}
      </SheetContent>
    </Sheet>
  );
};
