import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import { useEffect } from "react";

const router = createRouter({ routeTree } as any);

function AppRouterProvider() {
  useEffect(() => {
    const unsubscribe = router.subscribe("onResolved", function resetToTop() {
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    return unsubscribe;
  }, []);
  
  return <RouterProvider router={router} />;
}
export default AppRouterProvider;
