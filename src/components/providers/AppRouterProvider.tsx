import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";

const router = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultErrorComponent: ({ error }) => {
    console.error(error);
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center gap-5">
        <h1>Oops! Something went wrong.</h1>
        <button
          onClick={() => {
            window.location.reload();
          }}
        >
          Reload
        </button>
      </div>
    );
  },
});

function AppRouterProvider() {
  return <RouterProvider router={router} />;
}
export default AppRouterProvider;

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
