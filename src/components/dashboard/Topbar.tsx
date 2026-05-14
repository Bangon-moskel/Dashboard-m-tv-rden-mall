"use client";

import { useRef } from "react";
import Link from "next/link";
import { Moon, Sun, Plus, Eye, Pencil, Download, Upload, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDashboard } from "@/lib/store";
import type { DashboardConfig } from "@/lib/types";

export function Topbar({ showAdd, onAdd }: { showAdd?: boolean; onAdd?: () => void }) {
  const editMode = useDashboard((s) => s.editMode);
  const setEditMode = useDashboard((s) => s.setEditMode);
  const theme = useDashboard((s) => s.config.theme);
  const setTheme = useDashboard((s) => s.setTheme);
  const name = useDashboard((s) => s.config.name);
  const setName = useDashboard((s) => s.setDashboardName);
  const config = useDashboard((s) => s.config);
  const importConfig = useDashboard((s) => s.importConfig);
  const resetConfig = useDashboard((s) => s.resetConfig);

  const fileRef = useRef<HTMLInputElement>(null);

  const onExport = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.name || "dashboard"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (file: File) => {
    const text = await file.text();
    try {
      const parsed = JSON.parse(text) as DashboardConfig;
      if (!parsed.widgets || !parsed.pipelines) throw new Error("Ogiltigt format");
      importConfig(parsed);
    } catch (err) {
      alert(`Kunde inte importera: ${err instanceof Error ? err.message : err}`);
    }
  };

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-panel/80 backdrop-blur">
      <div className="flex items-center gap-3 px-6 h-14">
        <Link href="/" className="font-semibold tracking-tight">
          Dashboard-mall
        </Link>
        <div className="h-5 w-px bg-border" />
        {editMode ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-accent/40 rounded px-2 py-1"
          />
        ) : (
          <span className="text-sm text-muted">{name}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {showAdd && editMode && (
            <Button size="sm" variant="primary" onClick={onAdd}>
              <Plus className="size-4" /> Lägg till widget
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setEditMode(!editMode)}>
            {editMode ? <Eye className="size-4" /> : <Pencil className="size-4" />}
            {editMode ? "Visa" : "Redigera"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onExport} title="Exportera JSON">
            <Download className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fileRef.current?.click()}
            title="Importera JSON"
          >
            <Upload className="size-4" />
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onImport(file);
              e.target.value = "";
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            title="Rensa dashboard"
            onClick={() => {
              if (confirm("Rensa hela dashboarden?")) resetConfig();
            }}
          >
            <RotateCcw className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            title="Växla tema"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
