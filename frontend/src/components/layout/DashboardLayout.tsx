import { Outlet } from "react-router-dom";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";

export function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-6 md:px-8 py-5 md:py-6">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
