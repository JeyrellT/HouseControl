"use client";

import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useNexus } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const presentation = useNexus((s) => s.presentationMode);
  const collapsed = useNexus((s) => s.sidebarCollapsed);

  useEffect(() => {
    document.body.dataset.presentation = presentation ? "true" : "false";
  }, [presentation]);

  return (
    <div className="min-h-screen flex bg-surface text-ink">
      <Sidebar />
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          collapsed ? "md:ml-16" : "md:ml-64",
        )}
      >
        <Topbar />
        <main className="flex-1 px-4 md:px-8 py-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
