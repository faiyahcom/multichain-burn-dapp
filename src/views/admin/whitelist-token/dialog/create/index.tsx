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
import { useAppKitAccount } from "@reown/appkit/react";
import { useCreateWhitelistTokenSolanaFn } from "./useCreateWhitelistTokenSolanaFn";
import { useCreateWhitelistTokenEvmFn } from "./useCreateWhitelistTokenEvmFn";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { whitelistService } from "@/services/whitelistService";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { toast } from "sonner";
import { whitelistQueryKeys } from "@/services/queries/queryKey";
import { booleanString } from "@/types/common";

const networkIdValues = [
  "ethereumTestnet",
  "binanceTestnet",
  "xphereTestnet",
  "solanaDevnet",
] as const satisfies [NetworkId, ...NetworkId[]];

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
  const [isCallingSc, setIsCallingSc] = useState<boolean>(false);

  const { caipAddress } = useAppKitAccount();
  const namespace = caipAddress?.split(":")[0];
  const isSolana = namespace === "solana";
  const isEvm = namespace === "eip155";

  const { createWhitelistToken: createWhitelistTokenSolana } =
    useCreateWhitelistTokenSolanaFn();
  const { createWhitelistToken: createWhitelistTokenEvm } =
    useCreateWhitelistTokenEvmFn();

  const queryClient = useQueryClient();

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

  const {
    mutate: createWhitelistTokenMutation,
    isPending: isCreateWhitelistTokenPending,
  } = useMutation({
    mutationFn: async (data: WhitelistTokenFormValues) => {
      const formData = new FormData();
      formData.append("address", data.address.trim());
      formData.append("name", data.name);
      formData.append("symbol", data.symbol);
      const networkConfig = NETWORK_CONFIGS.find(
        (n) => n.id === data.networkId,
      );
      if (networkConfig) {
        formData.append("chainId", networkConfig.backendChainId);
      }
      if (data.image) {
        formData.append("img", data.image);
      }
      formData.append("description", data.description);
      formData.append("homepage", data.homepageLink);
      formData.append("whitepaper", data.docLink);
      // default to enable and not dropped
      formData.append("enable", booleanString[4]);
      formData.append("isDropped", booleanString[5]);

      const result = await whitelistService.createWhitelistToken(formData);
      return result;
    },
    onSuccess: () => {
      toast.success("Token whitelisted successfully!");

      queryClient.invalidateQueries({
        queryKey: whitelistQueryKeys.summary(),
      });
      queryClient.invalidateQueries({
        queryKey: whitelistQueryKeys.listTokens(),
        exact: false,
      });

      handleOpenChange(false);
    },
    onError: (error) => {
      const message = getErrorMessage({ error });
      toast.error(message);
    },
  });

  const onSubmit = async (data: WhitelistTokenFormValues) => {
    setIsCallingSc(true);
    if (isSolana) {
      const result = await createWhitelistTokenSolana({
        tokenAddress: data.address,
      });
      if (result) {
        createWhitelistTokenMutation(data);
      }
    }
    if (isEvm) {
      const result = await createWhitelistTokenEvm({
        tokenAddress: data.address,
      });
      if (result) {
        createWhitelistTokenMutation(data);
      }
    }
    setIsCallingSc(false);
  };

  const isLoading = isCreateWhitelistTokenPending || isCallingSc;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={"mb-primary"} size={"mb-square-btn"}>
          Add Token <PlusIcon className="size-3.75" />
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-185.75"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
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

          <div className="flex items-center justify-end gap-4.5">
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
                disabled: isLoading,
              }}
            />
            <AnimateIconButton
              variant="letter-icon"
              iconLetter="A"
              text={isLoading ? "Adding..." : "Add to Whitelist"}
              color="#9072f9"
              textVariant="text-self-center"
              classNames={{
                btn: "sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-mb-submit-border",
              }}
              btnProps={{
                type: "submit",
                disabled: isLoading,
              }}
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminWhitelistTokenDialogCreate;
