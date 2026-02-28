import { createFileRoute } from "@tanstack/react-router";
import PairListSearch from "../../views/pair-list/search";

export const Route = createFileRoute("/pair-list/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="pt-9.25 pl-27.5">
      <PairListSearch />
    </div>
  );
}
