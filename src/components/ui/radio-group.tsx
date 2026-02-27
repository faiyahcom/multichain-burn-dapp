import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { cn } from "@/lib/utils"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      className={cn(
        "inline-flex bg-transparent p-1",
        className
      )}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> & {
  children: React.ReactNode
}) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        "relative flex items-center gap-2 cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-all",
        "text-muted-foreground",
        "data-[state=checked]:bg-inactive",
        "data-[state=checked]:text-black",
        className
      )}
      {...props}
    >
      {/* Radio Circle */}
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-full border transition-all",
          "border-muted-foreground",
          "data-[state=checked]:border-primary"
        )}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <span className="h-2 w-2 rounded-full bg-primary" />
        </RadioGroupPrimitive.Indicator>
      </span>

      {children}
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }