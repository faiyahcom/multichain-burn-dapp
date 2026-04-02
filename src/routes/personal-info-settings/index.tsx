import PersonalInfoSettingsGlowForm from "@/views/personal-info-settings/glow/form";
import ProfileLayout from "@/views/profile/layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/personal-info-settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ProfileLayout
      classNames={{
        outerContainer: "lg:px-21.25",
        innerContainer: "lg:space-y-13",
      }}
    >
      <PersonalInfoSettingsGlowForm />
    </ProfileLayout>
  );
}
