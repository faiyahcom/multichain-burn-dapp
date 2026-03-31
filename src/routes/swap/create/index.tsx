import CreateSwapPool from "@/views/swap-pool/create";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/swap/create/")({
    validateSearch: (search: Record<string, unknown>) => ({
        tokenFrom: typeof search.tokenFrom === "string" ? search.tokenFrom : undefined,
        tokenTo: typeof search.tokenTo === "string" ? search.tokenTo : undefined,
        amount: typeof search.amount === "string" ? search.amount : undefined,
    }),
    component: RouteComponent,
});

function RouteComponent() {
    const { tokenFrom, tokenTo, amount } = Route.useSearch();
    return <CreateSwapPool tokenFrom={tokenFrom} tokenTo={tokenTo} amount={amount} />;
}
