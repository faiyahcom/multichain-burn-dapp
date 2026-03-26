import * as React from "react";

import { cn } from "@/lib/utils";
import { getVariantBorderClassName, type ContainerVariant } from "./container";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn(
          "w-max min-w-full table-fixed caption-bottom border-separate border-spacing-y-5 text-base font-normal sm:border-spacing-y-10 sm:text-28px",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function TableHeader({
  className,

  ...props
}: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("sm:text-3xl", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn(className)} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({
  className,

  ...props
}: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "group transition-all",

        className,
      )}
      {...props}
    />
  );
}

function TableHead({
  className,
  variant,
  ...props
}: React.ComponentProps<"th"> & {
  variant?: ContainerVariant;
}) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "px-2 py-3 text-center align-middle font-bold whitespace-nowrap sm:py-6 [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5",
        variant &&
          getVariantBorderClassName({
            variant: variant,
            custom: "rounded-none border-0 border-b-2",
          }),
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 sm:p-3 text-center align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
