"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { DashboardGrid } from "@/components/dashboard/Grid";
import { AddWidgetMenu } from "@/components/dashboard/AddWidgetMenu";
import { useDashboard } from "@/lib/store";

export default function HomePage() {
  const hydrated = useDashboard((s) => s.hydrated);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main>
      <Topbar showAdd onAdd={() => setMenuOpen(true)} />
      {hydrated ? (
        <DashboardGrid />
      ) : (
        <div className="p-12 text-muted">Laddar dashboard…</div>
      )}
      <AddWidgetMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </main>
  );
}
