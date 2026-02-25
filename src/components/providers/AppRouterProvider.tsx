import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";

const router = createRouter({ routeTree } as any);

function AppRouterProvider() {
  return <RouterProvider router={router} />;
}
export default AppRouterProvider;
