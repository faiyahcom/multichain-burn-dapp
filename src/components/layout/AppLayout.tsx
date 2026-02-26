import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MainHeader } from "./header/MainHeader";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <MainHeader />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto bg-white rounded-tl-xl rounded-br-xl">
          {children}
        </main>
      </div>
    </div>
  );
}

