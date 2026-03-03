import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NETWORK_CONFIGS, type NetworkId } from "@/config/networks";
import { PlusIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import AnimateIconButton from "@/components/common/animate-icon-button";
import NetworkImgIcon from "@/components/common/network-img-icon";
import ImageUpload from "./image-upload";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

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
  image: z
    .file()
    .mime(["image/png", "image/jpeg", "image/svg+xml"], {
      error: "Invalid image",
    })
    .max(5 * 1024 * 1024, { error: "Image size should be less than 5MB" })
    .optional(),
  description: z.string(),
  homepageLink: z.string(),
  docLink: z.string(),
});

type WhitelistTokenFormValues = z.infer<typeof whitelistTokenSchema>;

const AdminWhitelistTokenDialogCreate = () => {
  const [open, setOpen] = useState<boolean>(false);
  const { control, handleSubmit, resetField, reset } =
    useForm<WhitelistTokenFormValues>({
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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
    }
    setOpen(open);
  };

  const onSubmit = (data: WhitelistTokenFormValues) => {
    console.log(data);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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

        <form className="space-y-12.25" onSubmit={handleSubmit(onSubmit)}>
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
            <Controller
              control={control}
              name="networkId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-3.25">
                  <FieldLabel htmlFor={field.name}>
                    Network<span className="text-md-required-red">*</span>
                  </FieldLabel>
                  <div className="flex items-center gap-2.25">
                    {NETWORK_CONFIGS.map((network, index) => (
                      <AnimateIconButton
                        key={index}
                        variant="external-icon"
                        icon={({ className }) => (
                          <NetworkImgIcon
                            src={network.iconSrc}
                            alt={network.label}
                            className={className}
                          />
                        )}
                        isActive={field.value === network.id}
                        btnProps={{
                          onClick: () => field.onChange(network.id),
                        }}
                        text={network.label}
                        color={network.color}
                        classNames={{
                          btn: "after:text-primary-foreground",
                        }}
                      />
                    ))}
                  </div>
                </Field>
              )}
            />
            <Controller
              control={control}
              name="image"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Token Image</FieldLabel>
                  <ImageUpload
                    img={field.value}
                    onChange={(img) => {
                      if (img) {
                        field.onChange(img);
                      } else {
                        resetField("image");
                      }
                    }}
                    placeholder="Click to upload token image."
                  />
                  <FieldDescription className="pl-5">
                    PNG, JPG, or SVG. Max 5MB
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={control}
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="Brief description of the token"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <div className="grid grid-cols-1 gap-y-3.75 md:grid-cols-2 md:gap-x-1.25">
              <Controller
                control={control}
                name="homepageLink"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Homepage</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="https://uniswap.org"
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
                name="docLink"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Docs/Whitepaper
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="https://docs.uniswap.org"
                      className="px-5 placeholder:text-15px placeholder:text-secondary-text"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <AnimateIconButton
              variant="letter-icon"
              iconLetter="C"
              text="Cancel"
              color="#FF8E8E"
              textVariant="text-container-center"
              classNames={{
                btn: "bg-mb-cancel-gray sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-inactive",
              }}
              btnProps={{
                type: "reset",
                onClick: () => handleOpenChange(false),
              }}
            />
            <AnimateIconButton
              variant="letter-icon"
              iconLetter="A"
              text="Add to Whitelist"
              color="#9072f9"
              textVariant="text-self-center"
              classNames={{
                btn: "sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-mb-submit-border",
              }}
              btnProps={{
                type: "submit",
              }}
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminWhitelistTokenDialogCreate;
