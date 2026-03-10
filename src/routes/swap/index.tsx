import CommonPoolLayout from "@/views/pool";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/swap/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <CommonPoolLayout poolType={1} />;
}
