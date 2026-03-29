import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";

const router = createRouter({ routeTree } as any);

function AppRouterProvider() {
  router.subscribe("onResolved", function resetToTop() {
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  return <RouterProvider router={router} />;
}
export default AppRouterProvider;
