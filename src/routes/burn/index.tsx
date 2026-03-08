import BurnPoolListHeader from "@/views/burn-pool/list/header";
import BurnPoolListSearch from "@/views/burn-pool/list/search";
import BurnPoolListTable from "@/views/burn-pool/list/table";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/burn/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <BurnPoolListHeader />
      <BurnPoolListSearch />
      <BurnPoolListTable />
    </>
  );
}
