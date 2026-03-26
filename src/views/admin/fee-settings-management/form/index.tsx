import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ethers } from "ethers";
import BN from "bn.js";
import numbro from "numbro";
import Decimal from "decimal.js";
import { PublicKey } from "@solana/web3.js";

import {
  NETWORK_CONFIGS,
  type nativeCurrency,
  type NetworkConfig,
} from "@/config/networks";

import { useSystemStore } from "@/stores/systemStore";
import { DECIMAL_FEE_PERCENT, useFeeSettings } from "../hooks/useFeeSettings";
import { useUpdateFeeConfigEvmFn } from "../hooks/useUpdateFeeConfigEvmFn";
import { useUpdateFeeConfigSolFn } from "../hooks/useUpdateFeeConfigSolFn";

import NetworkImgIcon from "@/components/common/network-img-icon";
import { ArrowIcon } from "@/components/common/arrow-icon";
import AnimateIconButton from "@/components/common/animate-icon-button";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";
import { DEFAULT_INPUT_NUMBER_STEP } from "@/config/constant";

const createFeeSettingsSchema = (isSolana: boolean) =>
  z.object({
    creationFee: z
      .string()
      .min(1, "Required")
      .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "Must be \u2265 0"),
    settlementFee: z
      .string()
      .min(1, "Required")
      .refine(
        (v) => !isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100,
        "Must be between 0 and 100",
      ),
    treasury: z
      .string()
      .min(1, "Required")
      .refine(
        (v) => {
          if (isSolana) {
            try {
              new PublicKey(v);
              return true;
            } catch {
              return false;
            }
          }
          return ethers.isAddress(v);
        },
        isSolana ? "Invalid Solana address" : "Invalid EVM address",
      ),
  });

type FeeSettingsFormValues = {
  creationFee: string;
  settlementFee: string;
  treasury: string;
};

const formatNum = (n: number, mantissa: number) =>
  numbro(n).format({ mantissa, trimMantissa: true, thousandSeparated: false });

const formatCreationFee = (
  value: any,
  decimals: number,
  symbol: string,
): string | null => {
  if (!value) return null;
  const num = new Decimal(value.toString())
    .div(new Decimal(10).pow(decimals))
    .toNumber();
  return `${formatNum(num, 6)} ${symbol}`;
};

const formatSettlementFee = (value: any): string | null => {
  if (!value) return null;
  return `${formatNum(new Decimal(value.toString()).div(DECIMAL_FEE_PERCENT).toNumber(), 4)}%`;
};

const FeeSettingsForm = () => {
  const allNetworks = NETWORK_CONFIGS;

  const systemNetworkId = useSystemStore((s) => s.selectedNetworkId);
  const openSwitchNetworkModal = useSystemStore(
    (s) => s.openSwitchNetworkModal,
  );

  const [selectedNetworkId, setSelectedNetworkId] = useState(
    allNetworks.some((n) => n.id === systemNetworkId)
      ? systemNetworkId
      : (allNetworks[0]?.id ?? ""),
  );

  useEffect(() => {
    if (allNetworks.some((n) => n.id === systemNetworkId)) {
      setSelectedNetworkId(systemNetworkId);
    }
  }, [systemNetworkId]);

  const selectedNetwork = useMemo(
    () => allNetworks.find((n) => n.id === selectedNetworkId),
    [selectedNetworkId, allNetworks],
  );

  const nativeCurrencyInfo = selectedNetwork?.appKitNetwork.nativeCurrency as
    | nativeCurrency
    | undefined;

  const nativeSymbol = nativeCurrencyInfo?.symbol ?? "ETH";
  const nativeDecimals = nativeCurrencyInfo?.decimals ?? 18;
  const isSolana = selectedNetworkId === "solanaDevnet";

  const feeSettingsSchema = useMemo(
    () => createFeeSettingsSchema(isSolana),
    [isSolana],
  );

  const {
    creationFee,
    settlementFee,
    treasury,
    isLoading,
    refetch,
    updateValues,
  } = useFeeSettings(selectedNetworkId);

  const { updateFeeConfigEvm } = useUpdateFeeConfigEvmFn();
  const { updateFeeConfigSol } = useUpdateFeeConfigSolFn();

  const currentCreationFee = useMemo(
    () => formatCreationFee(creationFee, nativeDecimals, nativeSymbol),
    [creationFee, nativeDecimals, nativeSymbol],
  );

  const currentSettlementFee = useMemo(
    () => formatSettlementFee(settlementFee),
    [settlementFee],
  );

  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FeeSettingsFormValues>({
    resolver: zodResolver(feeSettingsSchema),
    defaultValues: {
      creationFee: "",
      settlementFee: "",
      treasury: "",
    },
  });

  // Prefill form when chain data loads
  useEffect(() => {
    if (!creationFee && !settlementFee && !treasury) return;

    reset({
      creationFee: creationFee
        ? new Decimal(creationFee.toString())
          .div(new Decimal(10).pow(nativeDecimals))
          .toString()
        : "",
      settlementFee: settlementFee
        ? new Decimal(settlementFee.toString())
          .div(DECIMAL_FEE_PERCENT)
          .toString()
        : "",
      treasury: treasury ?? "",
    });
  }, [creationFee, settlementFee, treasury, nativeDecimals, reset]);

  const handleNetworkChange = (network: NetworkConfig) => {
    openSwitchNetworkModal(selectedNetworkId as any, network.id);
  };

  const onSubmit = async (values: FeeSettingsFormValues) => {
    try {
      if (isSolana) {
        await updateFeeConfigSol(values);
      } else {
        await updateFeeConfigEvm(values);
      }

      // Optimistically update displayed current values using actual chain decimals
      const rawAmount = new Decimal(values.creationFee)
        .mul(new Decimal(10).pow(nativeDecimals))
        .toFixed(0);
      const bps = Math.round(parseFloat(values.settlementFee) * DECIMAL_FEE_PERCENT);
      updateValues(new BN(rawAmount), new BN(bps.toString()), values.treasury);

      // Background refetch to confirm from chain once the read node syncs
      setTimeout(() => refetch(), 3000);
    } catch {
      // handled in hooks
    }
  };

  return (
    <form
      className="w-full max-w-lg space-y-2"
      onSubmit={handleSubmit(onSubmit)}
    >
      <h2 className="text-xl font-semibold">Fee Configuration</h2>

      <div className="space-y-1.5">
        <p className="text-sm">Network</p>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex w-full max-w-60 items-center justify-between gap-2 rounded-lg bg-inactive text-sm font-normal text-foreground hover:bg-inactive/80"
            >
              {selectedNetwork && (
                <div className="flex items-center gap-2">
                  <NetworkImgIcon
                    src={selectedNetwork.iconSrc}
                    alt={selectedNetwork.label}
                  />
                  <span>{selectedNetwork.label}</span>
                </div>
              )}
              <ArrowIcon direction="down" className="text-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            sideOffset={6}
            className="w-(--radix-dropdown-menu-trigger-width) rounded-lg px-3 py-3"
          >
            {allNetworks.map((network) => {
              const isSelected = selectedNetworkId === network.id;

              return (
                <DropdownMenuItem
                  key={network.id}
                  onClick={() => handleNetworkChange(network)}
                  className={cn(
                    "my-2 flex cursor-pointer items-center gap-3 rounded-5px py-1.75 pr-3.5 pl-5 hover:bg-inactive",
                    isSelected && "bg-inactive font-semibold text-active",
                  )}
                >
                  <NetworkImgIcon src={network.iconSrc} alt={network.label} />
                  <span>{network.label}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm">Creation Fee</p>

        <div
          className={cn(
            "relative flex items-center",
            errors.creationFee && "rounded-md-plus ring-1 ring-destructive",
          )}
        >
          <Input
            {...register("creationFee")}
            type="number"
            min="0"
            step={DEFAULT_INPUT_NUMBER_STEP}
            placeholder={`Enter fee amount in ${nativeSymbol}`}
            className="pr-32"
          />

          <div className="absolute right-0 flex h-full items-center gap-2 rounded-md-plus bg-mb-summary-token-card px-12.5 py-2 text-lg">
            <NetworkImgIcon
              src={selectedNetwork?.iconSrc ?? ""}
              alt={nativeSymbol}
              className="size-5"
            />
            <span>{nativeSymbol}</span>
          </div>
        </div>

        {isLoading && <p className="text-xs text-primary">Loading...</p>}
        {!isLoading && currentCreationFee && (
          <p className="text-xs text-secondary-text">
            Current creation fee: {currentCreationFee}
          </p>
        )}
        {errors.creationFee && (
          <p className="text-xs text-destructive">
            {errors.creationFee.message}
          </p>
        )}
      </div>

      <div className="w-full max-w-60 space-y-1.5">
        <p className="text-sm">Settlement Fee (%)</p>

        <Input
          {...register("settlementFee")}
          type="number"
          min="0"
          max="100"
          step={DEFAULT_INPUT_NUMBER_STEP}
          placeholder="Enter settlement fee %"
          className={cn(errors.settlementFee && "ring-1 ring-destructive")}
        />

        {isLoading && <p className="text-xs text-secondary-text">Loading...</p>}
        {!isLoading && currentSettlementFee && (
          <p className="text-xs text-secondary-text">
            Current settlement fee: {currentSettlementFee}
          </p>
        )}
        {errors.settlementFee && (
          <p className="text-xs text-destructive">
            {errors.settlementFee.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <p className="text-sm">Fee Destination</p>

        <RadioGroup defaultValue="treasury">
          <RadioGroupItem value="treasury">Treasury</RadioGroupItem>
        </RadioGroup>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm">Treasury Address</p>

        <Input
          {...register("treasury", {
            onChange: () => clearErrors("treasury"),
            onBlur: () => trigger("treasury"),
          })}
          placeholder="Enter Treasury address"
          disabled={isLoading}
          className={cn(errors.treasury && "ring-1 ring-destructive")}
        />
        {errors.treasury && (
          <p className="text-xs text-destructive">{errors.treasury.message}</p>
        )}
      </div>

      <div className="mt-12 flex justify-center">
        <AnimateIconButton
          iconLetter="S"
          text="Save Changes"
          variant="letter-icon"
          textVariant="text-container-center"
          classNames={{
            btn: "w-76.25 text-center after:text-white after:text-xl after:font-semibold after:bg-active",
            text: "text-xl font-medium",
            icon: "size-8 text-xl",
          }}
          color="#966EFF"
          isLoading={isSubmitting}
          isLoadingText="Saving..."
          btnProps={{
            type: "submit",
            disabled: isSubmitting,
          }}
        />
      </div>
    </form>
  );
};

export default FeeSettingsForm;
