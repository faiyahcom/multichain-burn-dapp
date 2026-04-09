import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";

const router = createRouter({ routeTree, scrollRestoration: true });

function AppRouterProvider() {
  return <RouterProvider router={router} />;
}
export default AppRouterProvider;

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
