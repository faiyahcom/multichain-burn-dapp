import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { setupAxiosDefaults } from "@/config/axios";
import { AppkitProvider } from "@/components/providers/AppkitProvider";
import QueryProvider from "@/components/providers/QueryClientProvider";
import AppRouterProvider from "@/components/providers/AppRouterProvider";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import "./index.css";
import "./polyfills";

// ✅ Reload when a stale deployment causes chunk load failures
window.addEventListener("vite:preloadError", (event) => {
  const RELOAD_KEY = "vite:preloadError:reloaded";
  const hasReloaded = sessionStorage.getItem(RELOAD_KEY);

  console.error("Vite preload error:", event.payload);

  if (!hasReloaded) {
    sessionStorage.setItem(RELOAD_KEY, "true");
    window.location.reload();
  } else {
    sessionStorage.removeItem(RELOAD_KEY);
    console.error("Failed to load application after reload attempt");
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
