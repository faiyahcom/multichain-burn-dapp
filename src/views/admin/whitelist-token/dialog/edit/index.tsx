import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  NETWORK_CONFIGS,
  SOLANA_BACKEND_CHAIN_ID,
  chainIdToNetworkConfig,
  type NetworkId,
} from "@/config/networks";
import {
  poolTypes,
  poolTypeLabels,
  type PoolType,
} from "@/types/admin/master-pool-management";
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
import ImageUpload from "../create/image-upload";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  whitelistService,
  type WhitelistToken,
} from "@/services/whitelistService";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { toast } from "@/components/common/custom-toast";
import { whitelistQueryKeys } from "@/services/queries/queryKey";
import { useCreateWhitelistTokenSolanaFn } from "../create/useCreateWhitelistTokenSolanaFn";
import { useCreateWhitelistTokenEvmFn } from "../create/useCreateWhitelistTokenEvmFn";
import { useDisableWhitelistTokenEvmFn } from "../../table/useDisableWhitelistTokenEvmFn";

const networkIdValues = [
  "ethereum",
  "binance",
  "xphere",
  "solana",
] as const satisfies [NetworkId, ...NetworkId[]];

const whitelistTokenSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }),
  symbol: z.string().min(1, { error: "Symbol is required" }),
  address: z.string().min(1, { error: "Address is required" }),
  networkId: z.enum(networkIdValues),
  poolTypes: z.array(z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])).min(1, { error: "At least one pool type is required" }),
  image: z
    .file()
    .mime(["image/png", "image/jpeg", "image/svg+xml"], {
      error: "Only png, jpeg (jpg), and svg files are allowed",
    })
    .max(5 * 1024 * 1024, { error: "Image size should be less than 5MB" })
    .optional(),
  description: z.string(),
  homepageLink: z.string(),
  docLink: z.string(),
});

type WhitelistTokenFormValues = z.infer<typeof whitelistTokenSchema>;

interface Props {
  token: WhitelistToken;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdminWhitelistTokenDialogEdit: React.FC<Props> = ({
  token,
  open,
  onOpenChange,
}) => {
  const [imageRemoved, setImageRemoved] = useState(false);
  const [isCallingSc, setIsCallingSc] = useState(false);
  const queryClient = useQueryClient();

  const tokenNetworkConfig = chainIdToNetworkConfig(token.chainId);
  const tokenNetworkId = tokenNetworkConfig?.id;
  const isSolanaToken = token.chainId === SOLANA_BACKEND_CHAIN_ID;
  const isEvmToken = !isSolanaToken;

  const { createWhitelistToken: updateWhitelistTokenSolana } =
    useCreateWhitelistTokenSolanaFn();
  const { createWhitelistToken: updateWhitelistTokenEvm } =
    useCreateWhitelistTokenEvmFn();
  const { disableWhitelistToken: disableWhitelistTokenEvm } =
    useDisableWhitelistTokenEvmFn();

  // All pool types the token is registered for (regardless of enable status)
  const allKinds = (token.kind ?? []).map((k) => k.kind) as PoolType[];

  // The token's currently enabled pool types from the backend
  const initialKinds = (token.kind ?? [])
    .filter((k) => k.enable)
    .map((k) => k.kind) as PoolType[];

  // When all pool types are disabled, lock pool type editing but show which types exist
  const isTokenFullyDisabled = allKinds.length > 0 && initialKinds.length === 0;

  const { control, handleSubmit, resetField, reset } =
    useForm<WhitelistTokenFormValues>({
      defaultValues: {
        name: token.customName || token.name || "",
        symbol: token.customSymbol || token.symbol || "",
        address: token.address,
        networkId: tokenNetworkId,
        poolTypes: initialKinds,
        image: undefined,
        description: token.description || "",
        homepageLink: token.homepage || "",
        docLink: token.whitepaper || "",
      },
      resolver: zodResolver(whitelistTokenSchema),
    });

  const handleDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
      setImageRemoved(false);
    }
    onOpenChange(isOpen);
  };

  const {
    mutate: updateWhitelistTokenMutation,
    isPending: isUpdatePending,
  } = useMutation({
    mutationFn: async (data: WhitelistTokenFormValues) => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("symbol", data.symbol);
      formData.append("description", data.description);
      formData.append("homepage", data.homepageLink);
      formData.append("whitepaper", data.docLink);
      if (data.image) {
        formData.append("img", data.image);
      }
      if (imageRemoved) {
        formData.append("removeImg", "true");
      }

      const result = await whitelistService.updateWhitelistToken({
        chainId: token.chainId,
        address: token.address,
        data: formData,
      });
      return result;
    },
    onSuccess: () => {
      toast.success("Token updated successfully!");
      queryClient.invalidateQueries({
        queryKey: whitelistQueryKeys.listTokens().filter(Boolean),
      });

      handleDialogOpenChange(false);
    },
    onError: (error) => {
      const message = getErrorMessage({ error });
      toast.error(message);
    },
  });

  const syncBackendStatus = async (
    nextStatuses: { active: boolean; kind: PoolType; isDropped?: boolean }[],
  ) => {
    await Promise.all(
      nextStatuses.map((status) =>
        whitelistService.updateStatusWhitelistTokenStatus({
          chainId: token.chainId,
          address: token.address,
          active: status.active,
          kind: status.kind,
          isDropped: status.isDropped,
        }),
      ),
    );
  };

  const onSubmit = async (data: WhitelistTokenFormValues) => {
    const selectedPoolTypes = data.poolTypes;

    // Determine which pool types to enable/disable compared to initial state
    const toEnable = selectedPoolTypes.filter(
      (t) => !initialKinds.includes(t),
    );
    const toDisable = initialKinds.filter(
      (t) => !selectedPoolTypes.includes(t),
    );

    // If there are on-chain pool type changes, call the SC
    if (toEnable.length > 0 || toDisable.length > 0) {
      setIsCallingSc(true);

      if (isSolanaToken) {
        const result = await updateWhitelistTokenSolana({
          tokenAddress: data.address,
          poolTypes: toEnable,
          disablePoolTypes: toDisable,
        });
        if (!result) {
          setIsCallingSc(false);
          return;
        }
      }

      if (isEvmToken) {
        if (toDisable.length > 0) {
          const disableResult = await disableWhitelistTokenEvm({
            tokenAddress: data.address,
            poolTypes: toDisable,
          });

          if (!disableResult) {
            setIsCallingSc(false);
            return;
          }
        }

        if (toEnable.length > 0) {
          const enableResult = await updateWhitelistTokenEvm({
            tokenAddress: data.address,
            poolTypes: toEnable,
          });

          if (!enableResult) {
            setIsCallingSc(false);
            return;
          }
        }
      }

      const nextStatuses = [
        ...toEnable.map((kind) => ({ active: true, kind, isDropped: false })),
        ...toDisable.map((kind) => ({
          active: false,
          kind,
          isDropped: true,
        })),
      ];

      try {
        await syncBackendStatus(nextStatuses);
      } catch (error) {
        toast.error("On-chain update succeeded but backend sync failed", {
          description: getErrorMessage({ error }),
        });
      } finally {
        await queryClient.invalidateQueries({
          queryKey: whitelistQueryKeys.listTokens().filter(Boolean),
        });
      }

      setIsCallingSc(false);
    }

    // Then update backend metadata
    updateWhitelistTokenMutation(data);
  };

  const isLoading = isUpdatePending || isCallingSc;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-185.75"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>EDIT WHITELIST TOKEN</DialogTitle>
          <DialogDescription>
            Update the token details in the whitelist
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
                    className="px-5 placeholder:text-15px placeholder:text-secondary-text bg-inactive cursor-not-allowed"
                    readOnly
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Field>
              <FieldLabel>Decimal</FieldLabel>
              <Input
                value={String(token.decimals)}
                className="px-5 placeholder:text-15px placeholder:text-secondary-text bg-inactive cursor-not-allowed"
                readOnly
                disabled
              />
            </Field>
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
                        isActive={tokenNetworkId === network.id}
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
              name="poolTypes"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-3.25">
                  <FieldLabel htmlFor={field.name}>
                    Pool type<span className="text-md-required-red">*</span>
                  </FieldLabel>
                  <div className="flex items-center gap-2.25">
                    {poolTypes.map((type) => {
                      const selected = (field.value ?? []).includes(type);
                      // When fully disabled, highlight pool types that exist in allKinds
                      const highlighted = isTokenFullyDisabled && allKinds.includes(type);
                      return (
                        <AnimateIconButton
                          key={type}
                          variant="letter-icon"
                          iconLetter={poolTypeLabels[type][0]}
                          isActive={selected || highlighted}
                          btnProps={{
                            type: "button",
                            disabled: isTokenFullyDisabled,
                            onClick: () => {
                              if (isTokenFullyDisabled) return;
                              const current = field.value ?? [];
                              field.onChange(
                                selected
                                  ? current.filter((t) => t !== type)
                                  : [...current, type],
                              );
                            },
                          }}
                          text={poolTypeLabels[type]}
                          color="#9072f9"
                          classNames={{
                            btn: "after:text-primary-foreground",
                          }}
                        />
                      );
                    })}
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
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
                    initialUrl={!imageRemoved ? token.imageUri : undefined}
                    onRemoveInitialUrl={() => setImageRemoved(true)}
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

          {isTokenFullyDisabled && (
            <p className="text-sm font-medium text-mb-danger">
              Disable all pool type can not edit whitelist token
            </p>
          )}

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
                onClick: () => handleDialogOpenChange(false),
                disabled: isLoading,
              }}
            />
            <AnimateIconButton
              variant="letter-icon"
              iconLetter="S"
              text={"Save Changes"}
              color="#9072f9"
              textVariant="text-self-center"
              classNames={{
                btn: "sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-mb-submit-border",
              }}
              btnProps={{
                type: "submit",
                disabled: isTokenFullyDisabled,
              }}
              isLoading={isLoading}
              isLoadingText="Saving..."
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminWhitelistTokenDialogEdit;
