// src/layout/AppShell.tsx
import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useI18n } from "../context/i18nContext";
import Sidebar from "../ui/sidebar";
import Navbar from "../ui/navbar";
import LoadingState from "../ui/loadingState";

export default function AppShell() {
  const location = useLocation();
  const { t } = useI18n();
  const [isRouteTransitioning, setIsRouteTransitioning] = useState(false);
  const isFirstRoute = useRef(true);

  useEffect(() => {
    if (isFirstRoute.current) {
      isFirstRoute.current = false;
      return;
    }

    setIsRouteTransitioning(true);
    const timeoutId = window.setTimeout(() => {
      setIsRouteTransitioning(false);
    }, 520);

    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, location.search]);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Navbar />
        <main className="relative flex-1 overflow-y-auto px-8 py-6">
          <Outlet />
          {isRouteTransitioning ? (
            <LoadingState
              variant="overlay"
              title={t("common.loadingRoute")}
              message={t("common.loadingRouteHint")}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}
