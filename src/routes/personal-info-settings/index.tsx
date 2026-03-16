import PersonalInfoSettingsForm from "@/views/personal-info-settings/form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/personal-info-settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="w-full max-w-139.75 space-y-4.25 px-23.25 py-12.75">
      <h1 className="text-3xl font-semibold">Personal Info Settings</h1>
      <PersonalInfoSettingsForm />
    </div>
  );
}
