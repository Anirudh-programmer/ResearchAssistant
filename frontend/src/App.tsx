import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute, PublicOnlyRoute } from "@/contexts/ProtectedRoute";
import { LandingPage } from "@/pages/LandingPage";

const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const ResearchPage = lazy(() => import("@/pages/ResearchPage").then((m) => ({ default: m.ResearchPage })));
const HistoryPage = lazy(() => import("@/pages/HistoryPage").then((m) => ({ default: m.HistoryPage })));
const ReportDetailPage = lazy(() =>
  import("@/pages/ReportDetailPage").then((m) => ({ default: m.ReportDetailPage })),
);
const SavedCompaniesPage = lazy(() =>
  import("@/pages/SavedCompaniesPage").then((m) => ({ default: m.SavedCompaniesPage })),
);
const SignInPage = lazy(() => import("@/pages/SignInPage").then((m) => ({ default: m.SignInPage })));
const SignUpPage = lazy(() => import("@/pages/SignUpPage").then((m) => ({ default: m.SignUpPage })));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="size-6 animate-spin rounded-full border-2 border-border-strong border-t-accent" />
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/report/:reportId" element={<ReportDetailPage />} />
          <Route path="/saved" element={<SavedCompaniesPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
