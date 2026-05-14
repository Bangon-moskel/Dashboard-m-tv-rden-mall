"use client";

import type { Widget } from "@/lib/types";
import { WidgetFrame } from "./WidgetFrame";
import { usePipelineData } from "./usePipelineData";

export function KpiWidget({ widget, editMode }: { widget: Widget; editMode: boolean }) {
  const { bound, loading, errorSummary } = usePipelineData(widget.pipelineId);
  const value = bound.value;
  const label = (bound.label as string | undefined) ?? "";

  return (
    <WidgetFrame
      widgetId={widget.id}
      title={widget.title}
      pipelineId={widget.pipelineId}
      editMode={editMode}
      error={errorSummary}
      loading={loading}
    >
      <div className="flex h-full flex-col justify-center">
        <div className="text-3xl font-semibold tracking-tight truncate">
          {format(value)}
        </div>
        {label && <div className="text-xs text-muted mt-1 truncate">{label}</div>}
      </div>
    </WidgetFrame>
  );
}

function format(v: unknown): string {
  if (v === undefined || v === null) return "—";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return String(v);
    if (Math.abs(v) >= 1000) return v.toLocaleString("sv-SE");
    return String(v);
  }
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
