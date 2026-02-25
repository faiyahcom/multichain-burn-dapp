import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { setupAxiosDefaults } from "@/config/axios";
import { AppkitProvider } from "@/components/providers/AppkitProvider";
import QueryProvider from "@/components/providers/QueryClientProvider";
import AppRouterProvider from "@/components/providers/AppRouterProvider";
import "./index.css";

setupAxiosDefaults();

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryProvider>
        <AppkitProvider>
          <AppRouterProvider />
        </AppkitProvider>
      </QueryProvider>
    </StrictMode>,
  );
}
