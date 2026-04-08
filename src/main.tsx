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
window.addEventListener("vite:preloadError", () => {
  const RELOAD_KEY = "vite:preloadError:reloaded";
  const reloadCount = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
  if (reloadCount < 2) {
    sessionStorage.setItem(RELOAD_KEY, String(reloadCount + 1));
    window.location.reload();
  } else {
    sessionStorage.removeItem(RELOAD_KEY);
    console.error("Failed to load application after multiple reload attempts");
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
