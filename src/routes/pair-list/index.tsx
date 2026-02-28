import { createFileRoute } from "@tanstack/react-router";
import PairListSearch from "../../views/pair-list/search";
import PairListList from "@/views/pair-list/list";

export const Route = createFileRoute("/pair-list/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="pt-9.25 w-full h-full">
      <PairListSearch />
      <PairListList />
    </div>
  );
}
