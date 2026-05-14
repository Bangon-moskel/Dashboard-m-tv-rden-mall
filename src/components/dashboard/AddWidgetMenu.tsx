"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, LineChart, Gauge, Table, Activity } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDashboard } from "@/lib/store";
import type { WidgetKind } from "@/lib/types";
import { widgetKindLabel } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

const ITEMS: { kind: WidgetKind; icon: React.ComponentType<{ className?: string }> }[] = [
  { kind: "kpi", icon: Gauge },
  { kind: "line", icon: LineChart },
  { kind: "bar", icon: BarChart3 },
  { kind: "table", icon: Table },
  { kind: "status", icon: Activity },
];

export function AddWidgetMenu({ open, onClose, onCreated }: Props) {
  const addWidget = useDashboard((s) => s.addWidget);
  const createPipeline = useDashboard((s) => s.createPipelineForWidget);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open && !closing) return null;

  const handle = (kind: WidgetKind) => {
    const widget = addWidget(kind);
    createPipeline(widget.id);
    onCreated?.(widget.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center bg-black/40 p-8"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg rounded-lg border border-border bg-panel p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Välj widget-typ</h2>
        <div className="grid grid-cols-2 gap-2">
          {ITEMS.map(({ kind, icon: Icon }) => (
            <button
              key={kind}
              onClick={() => handle(kind)}
              className="flex items-center gap-3 rounded-md border border-border p-3 text-left hover:border-accent hover:bg-accent/10"
            >
              <Icon className="size-5 text-accent" />
              <div>
                <div className="text-sm font-medium">{widgetKindLabel(kind)}</div>
                <div className="text-xs text-muted">{describe(kind)}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="ghost" onClick={onClose}>
            Avbryt
          </Button>
        </div>
      </div>
    </div>
  );
}

function describe(kind: WidgetKind): string {
  return {
    kpi: "Stort numeriskt värde",
    line: "Tidsserie över x/y",
    bar: "Staplar för kategorier",
    table: "Lista över rader",
    status: "Färgad badge baserad på värde",
  }[kind];
}
