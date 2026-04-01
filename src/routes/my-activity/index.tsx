import ProfileLayout from "@/views/profile/layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/my-activity/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ProfileLayout></ProfileLayout>;
}
