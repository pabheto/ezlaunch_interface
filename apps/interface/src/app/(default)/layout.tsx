"use client";

import Sidebar from "@/shared/components/ui/sidebar";
import Header from "@/shared/components/ui/header";
import { MockTradingEngineProvider } from "@/features/trading/state/providers/MockTradingProvider";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/*  Site header */}
        <Header />

        <main className="grow [&>*:first-child]:scroll-mt-16">
          <MockTradingEngineProvider>{children}</MockTradingEngineProvider>
        </main>
      </div>
    </div>
  );
}
