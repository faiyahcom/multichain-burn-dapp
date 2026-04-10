import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { setupAxiosDefaults } from "@/config/axios";
import { AppkitProvider } from "@/components/providers/AppkitProvider";
import QueryProvider from "@/components/providers/QueryClientProvider";
import AppRouterProvider from "@/components/providers/AppRouterProvider";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import "./index.css";
import "./polyfills";

const reloadKey = "vite-preload-reload";
window.addEventListener("vite:preloadError", (e) => {
  console.log("vite:preloadError", e);
  const lastReload = sessionStorage.getItem(reloadKey);
  const now = Date.now();
  console.log("vite:preloadError", lastReload, now, now - Number(lastReload));

  // Only reload if we haven't reloaded in the last 30 seconds
  if (!lastReload || now - Number(lastReload) > 30000) {
    sessionStorage.setItem(reloadKey, String(now));
    window.location.reload();
  }
});

setupAxiosDefaults();

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryProvider>
        <AppkitProvider>
          <ThemeProvider defaultTheme="light" storageKey="xfaiyah-ui-theme">
            <AppRouterProvider />
          </ThemeProvider>
        </AppkitProvider>
      </QueryProvider>
    </StrictMode>,
  );
}
