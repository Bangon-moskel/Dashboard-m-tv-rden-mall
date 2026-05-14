"use client";

import { useEffect } from "react";
import { useDashboard } from "@/lib/store";

export function ThemeBoundary({ children }: { children: React.ReactNode }) {
  const hydrate = useDashboard((s) => s.hydrate);
  const hydrated = useDashboard((s) => s.hydrated);
  const theme = useDashboard((s) => s.config.theme);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme, hydrated]);

  return <>{children}</>;
}
