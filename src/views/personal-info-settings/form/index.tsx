import AnimateIconButton from "@/components/common/animate-icon-button";
import { toast } from "@/components/common/custom-toast";
import SingleImageUpload from "@/components/common/single-image-upload";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  authService,
  type UpdatePersonalInfoRequest,
} from "@/services/authService";
import { authQueryKeys } from "@/services/queries/queryKey";
import { useAuthStore } from "@/stores/authStore";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { truncateString } from "@/utils/helpers/string";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

const personalInfoSettingsFormSchema = z.object({
  avatar: z
    .union([
      z.url(),
      z
        .file()
        .mime(["image/png", "image/jpeg", "image/svg+xml"], {
          error: "Only png, jpeg (jpg), and svg files are allowed",
        })
        .max(5 * 1024 * 1024, { error: "Image size should be less than 5MB" }),
    ])
    .optional()
    .nullable(),
  nickname: z.string().trim().optional().nullable(),
  address: z.string(),
});

type PersonalInfoSettingsFormValues = z.infer<
  typeof personalInfoSettingsFormSchema
>;

const PersonalInfoSettingsForm = () => {
  const { user, _hasHydrated } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: userApiData, isPending: isGetCurrentUserPending } = useQuery({
    queryKey: authQueryKeys.me({
      address: user?.address,
    }),
    queryFn: async () => {
      return authService.getCurrentUser();
    },
    enabled: !!user?.address,
    staleTime: Infinity,
  });

  const { control, handleSubmit, setValue } =
    useForm<PersonalInfoSettingsFormValues>({
      defaultValues: {
        avatar: userApiData?.avatar ?? undefined,
        nickname: userApiData?.name ?? "",
        address: user?.address,
      },
      resolver: zodResolver(personalInfoSettingsFormSchema),
    });

  const {
    mutate: updatePersonalInfoMutation,
    isPending: isUpdatePersonalInfoPending,
  } = useMutation({
    mutationFn: async (data: UpdatePersonalInfoRequest) => {
      return authService.updatePersonalInfo(data);
    },
    onSuccess: () => {
      toast.success("Personal info updated successfully!");
      queryClient.invalidateQueries({
        queryKey: authQueryKeys.me({
          address: user?.address,
        }),
      });
    },
    onError: (error) => {
      const message = getErrorMessage({ error });
      toast.error(message);
    },
  });

  const onSubmit = async (data: PersonalInfoSettingsFormValues) => {
    updatePersonalInfoMutation({
      avatar: data.avatar instanceof File ? data.avatar : undefined,
      name: data.nickname,
    });
  };

  useEffect(() => {
    if (_hasHydrated && user && user.address) {
      setValue("address", user.address);
    }
  }, [_hasHydrated, user, setValue]);

  useEffect(() => {
    if (userApiData) {
      setValue("avatar", userApiData.avatar);
      setValue("nickname", userApiData.name);
    }
  }, [userApiData, setValue]);

  const labelClassName = "text-2xl font-medium";

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name="avatar"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="mb-8.5 gap-2.75">
            <FieldLabel htmlFor={field.name} className={labelClassName}>
              Avatar
            </FieldLabel>
            <SingleImageUpload
              img={field.value}
              aria-invalid={fieldState.invalid}
              placeholderSrc="/images/placeholder-avatar.png"
              alt="Avatar"
              id={field.name}
              onChange={(img) => {
                if (img) {
                  field.onChange(img);
                }
              }}
              classNames={{
                container: "ml-3.25",
              }}
              isLoading={isGetCurrentUserPending}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        control={control}
        name="nickname"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="mb-8.75 gap-5.25">
            <FieldLabel htmlFor={field.name} className={labelClassName}>
              Nickname
            </FieldLabel>
            <Input
              {...field}
              value={field.value ?? ""}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="Nickname"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        control={control}
        name="address"
        render={({ field, fieldState }) => (
          <Field
            data-invalid={fieldState.invalid}
            className="mb-14.25 gap-5.25"
          >
            <FieldLabel htmlFor={field.name} className={labelClassName}>
              Address
            </FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="Address"
              readOnly
              value={truncateString({ str: field.value })}
              title={field.value}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <AnimateIconButton
        variant="letter-icon"
        textVariant="text-container-center"
        iconLetter="S"
        text="Save"
        color="#966EFF"
        classNames={{
          btn: "after:text-primary-foreground w-full max-w-72.5",
        }}
        btnProps={{
          type: "submit",
          disabled: isGetCurrentUserPending,
        }}
        isLoading={isUpdatePersonalInfoPending}
        isLoadingText="Saving..."
      />
    </form>
  );
};

export default PersonalInfoSettingsForm;
