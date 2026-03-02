import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { NetworkId } from "@/config/networks";
import { PlusIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const networkIdValues = [
  "ethereumTestnet",
  "binanceTestnet",
  "xphereTestnet",
  "solanaDevnet",
] as const satisfies [NetworkId, ...NetworkId[]];

// TODO: schema might need to change
const whitelistTokenSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }),
  symbol: z.string().min(1, { error: "Symbol is required" }),
  address: z.string().min(1, { error: "Address is required" }),
  networkId: z.enum(networkIdValues),
  image: z.file().mime(["image/*"]),
  description: z.string(),
  homepageLink: z.string(),
  docLink: z.string(),
});

type WhitelistTokenFormValues = z.infer<typeof whitelistTokenSchema>;

const AdminWhitelistTokenDialogCreate = () => {
  const { control, handleSubmit } = useForm<WhitelistTokenFormValues>({
    defaultValues: {
      name: "",
      symbol: "",
      address: "",
      networkId: "ethereumTestnet",
      image: undefined,
      description: "",
      homepageLink: "",
      docLink: "",
    },
    resolver: zodResolver(whitelistTokenSchema),
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={"mb-primary"} size={"mb-square-btn"}>
          Add Token <PlusIcon className="size-3.75" />
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="sm:max-w-185.75">
        <DialogHeader>
          <DialogTitle>ADD TOKEN TO WHITELIST</DialogTitle>
          <DialogDescription>
            Fill in the token details to add it to the whitelist
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.75">
          <div className="grid grid-cols-1 gap-y-3.75 md:grid-cols-2 md:gap-x-1.25">
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Name<span className="text-md-required-red">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="Uniswap"
                    className="px-5 placeholder:text-15px placeholder:text-secondary-text"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={control}
              name="symbol"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Symbol<span className="text-md-required-red">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="UNI"
                    className="px-5 placeholder:text-15px placeholder:text-secondary-text"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
          <Controller
            control={control}
            name="address"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Token Address<span className="text-md-required-red">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="0x0000000000000000000000000000000000000000"
                  className="px-5 placeholder:text-15px placeholder:text-secondary-text"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminWhitelistTokenDialogCreate;
