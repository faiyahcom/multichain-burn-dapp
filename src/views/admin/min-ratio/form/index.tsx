import AnimateIconButton from "@/components/common/animate-icon-button";
import { toast } from "@/components/common/custom-toast";
import WhitelistTokenSelect from "@/components/common/whitelist-token-select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  pairConfigsService,
  type PairConfigCreateRequest,
  type PairConfigUpdateRequest,
} from "@/services/pairConfigsService";
import { pairConfigsQueryKeys } from "@/services/queries/queryKey";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

type Props =
  | { chainId: string; tokenIn: string; tokenOut: string }
  | { chainId?: undefined; tokenIn?: undefined; tokenOut?: undefined };

const minRatioSchema = z.object({
  tokenIn: z
    .string({
      error: "Token In is required",
    })
    .min(1, { error: "Token In is required" }),
  tokenOut: z
    .string({
      error: "Token Out is required",
    })
    .min(1, { error: "Token Out is required" }),
  minRatio: z
    .string()
    .trim()
    .min(1, { error: "Min Ratio is required" })
    .refine((value) => /^(-?[\d.]+):(-?[\d.]+)$/.test(value), {
      error: 'Ratio must be in format "X:Y" (e.g. 1:2)',
    })
    .refine(
      (value) => {
        const match = value.match(/^(-?[\d.]+):(-?[\d.]+)$/);
        if (!match) return false;
        return (
          Number.isInteger(Number(match[1])) &&
          Number.isInteger(Number(match[2]))
        );
      },
      { error: "Both numbers must be integers" },
    )
    .refine(
      (value) => {
        const match = value.match(/^(-?[\d.]+):(-?[\d.]+)$/);
        if (!match) return false;
        return Number(match[1]) > 0 && Number(match[2]) > 0;
      },
      { error: "Both numbers must be greater than zero" },
    ),
});
type MinRatioFormValues = z.infer<typeof minRatioSchema>;

const AdminMinRatioForm: React.FC<Props> = ({ chainId, tokenIn, tokenOut }) => {
  const isEdit = !!chainId && !!tokenIn && !!tokenOut;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { control, handleSubmit, watch, setValue, reset } =
    useForm<MinRatioFormValues>({
      defaultValues: {
        tokenIn: undefined,
        tokenOut: undefined,
        minRatio: "",
      },
      resolver: zodResolver(minRatioSchema),
    });
  const tokenInValue = watch("tokenIn");
  const tokenOutValue = watch("tokenOut");

  const {
    data: pairConfigData,
    isPending: isDetailPairConfigPending,
    isEnabled: isDetailPairConfigEnabled,
  } = useQuery({
    queryKey: pairConfigsQueryKeys.detail({ chainId, tokenIn, tokenOut }),
    queryFn: async () => {
      return pairConfigsService.detailPairConfig({
        chainId: chainId!,
        tokenIn: tokenIn!,
        tokenOut: tokenOut!,
      });
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (
      isDetailPairConfigEnabled &&
      !isDetailPairConfigPending &&
      pairConfigData
    ) {
      setValue("tokenIn", pairConfigData.pairConfig.tokenIn);
      setValue("tokenOut", pairConfigData.pairConfig.tokenOut);
      const ratioNumerator = pairConfigData.pairConfig.ratioNumerator;
      const ratioDenominator = pairConfigData.pairConfig.ratioDenominator;
      setValue("minRatio", `${ratioNumerator}:${ratioDenominator}`);
    }
  }, [
    isDetailPairConfigEnabled,
    isDetailPairConfigPending,
    pairConfigData,
    setValue,
  ]);

  const { mutate: createMinRatioMutate, isPending: isCreateMinRatioPending } =
    useMutation({
      mutationFn: async (request: PairConfigCreateRequest) => {
        return await pairConfigsService.createPairConfig(request);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: pairConfigsQueryKeys.list().filter(Boolean),
          exact: false,
        });
        reset();
        toast.success("Min ratio added successfully!");
        navigate({ to: "/admin/min-ratio" });
      },
      onError: (error) => {
        const message = getErrorMessage({ error });
        toast.error(message);
      },
    });

  const { mutate: updateMinRatioMutate, isPending: isUpdateMinRatioPending } =
    useMutation({
      mutationFn: async (request: PairConfigUpdateRequest) => {
        return await pairConfigsService.updatePairConfig(request);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: pairConfigsQueryKeys.list().filter(Boolean),
          exact: false,
        });
        reset();
        toast.success("Min ratio updated successfully!");
        navigate({ to: "/admin/min-ratio" });
      },
      onError: (error) => {
        const message = getErrorMessage({ error });
        toast.error(message);
      },
    });

  const onSubmit = (values: MinRatioFormValues) => {
    const [rawNumerator, rawDenominator] = values.minRatio.split(":");
    if (isEdit) {
      updateMinRatioMutate({
        tokenIn: values.tokenIn,
        tokenOut: values.tokenOut,
        ratioNumerator: rawNumerator,
        ratioDenominator: rawDenominator,
        enable: true,
      });
    } else {
      createMinRatioMutate({
        tokenIn: values.tokenIn,
        tokenOut: values.tokenOut,
        ratioNumerator: rawNumerator,
        ratioDenominator: rawDenominator,
        enable: true,
      });
    }
  };

  const isApiPending = isCreateMinRatioPending || isUpdateMinRatioPending;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="w-full space-y-8">
        <h2 className="text-center text-3xl font-semibold">
          {isEdit ? "Edit" : "Add"} Min Ratio
        </h2>
        <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            control={control}
            name="tokenIn"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Token In</FieldLabel>
                <WhitelistTokenSelect
                  value={field.value}
                  onChange={(address) => {
                    field.onChange(address);
                  }}
                  disabledAddress={tokenOutValue}
                  btnProps={{
                    disabled: isEdit,
                  }}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="tokenOut"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Token Out</FieldLabel>
                <WhitelistTokenSelect
                  value={field.value}
                  onChange={(address) => {
                    field.onChange(address);
                  }}
                  disabledAddress={tokenInValue}
                  btnProps={{
                    disabled: isEdit,
                  }}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="minRatio"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Min Ratio</FieldLabel>
                <Input {...field} placeholder="1:1" />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <div className="flex flex-wrap items-center justify-center gap-4">
            <AnimateIconButton
              variant="letter-icon"
              textVariant="text-container-center"
              iconLetter="C"
              text="Cancel"
              color="#FF8E8E"
              btnProps={{
                type: "reset",
                onClick: () => {
                  reset();
                  navigate({ to: "/admin/min-ratio" });
                },
                disabled: isApiPending,
              }}
              classNames={{
                btn: "bg-mb-cancel-gray sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-inactive",
              }}
            />
            <AnimateIconButton
              variant="letter-icon"
              textVariant="text-container-center"
              iconLetter="S"
              text="Submit"
              color="#966EFF"
              btnProps={{
                type: "submit",
              }}
              classNames={{
                btn: "sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-mb-submit-border",
              }}
              isLoading={isApiPending}
              isLoadingText="Submitting..."
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminMinRatioForm;
