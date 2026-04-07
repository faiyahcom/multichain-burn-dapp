import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2.25 text-center">
      <h1 className="text-40px font-extrabold">WELCOME TO FAIYAH.COM</h1>
      <p className="text-2xl font-normal">Your Gateway to DeFi Services</p>
    </div>
  );
}
