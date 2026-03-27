import CommonPoolLayout from "@/views/pool";
import { PoolKindCodeEnum } from "@/types/pool";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/swap/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <CommonPoolLayout poolType={PoolKindCodeEnum.Swap} />;
}
