import AnimateIconButton from "@/components/common/animate-icon-button";
import SingleImageUpload from "@/components/common/single-image-upload";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { truncateString } from "@/utils/helpers/string";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

const personalInfoSettingsFormSchema = z.object({
  avatar: z
    .union([
      z.url(),
      z
        .file()
        .mime(["image/png", "image/jpeg", "image/svg+xml"], {
          error: "Invalid image",
        })
        .max(5 * 1024 * 1024, { error: "Image size should be less than 5MB" }),
    ])
    .optional(),
  nickname: z.string().optional(),
  address: z.string(),
});

type PersonalInfoSettingsFormValues = z.infer<
  typeof personalInfoSettingsFormSchema
>;

const PersonalInfoSettingsForm = () => {
  const { user } = useAuthStore();

  const { control, handleSubmit, setValue } =
    useForm<PersonalInfoSettingsFormValues>({
      defaultValues: {
        avatar: undefined,
        nickname: "",
        address: user?.address,
      },
      resolver: zodResolver(personalInfoSettingsFormSchema),
    });

  const onSubmit = async (data: PersonalInfoSettingsFormValues) => {
    console.log(data);
  };

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
        }}
      />
    </form>
  );
};

export default PersonalInfoSettingsForm;
