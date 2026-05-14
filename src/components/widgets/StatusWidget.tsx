"use client";

import type { Widget } from "@/lib/types";
import { WidgetFrame } from "./WidgetFrame";
import { usePipelineData } from "./usePipelineData";
import { cn } from "@/lib/utils";

export function StatusWidget({ widget, editMode }: { widget: Widget; editMode: boolean }) {
  const { bound, loading, errorSummary } = usePipelineData(widget.pipelineId);
  const status = stateOf(bound.status ?? bound.value);
  const label = (bound.label as string | undefined) ?? defaultLabel(status);

  return (
    <WidgetFrame
      widgetId={widget.id}
      title={widget.title}
      pipelineId={widget.pipelineId}
      editMode={editMode}
      error={errorSummary}
      loading={loading}
    >
      <div className="flex h-full items-center justify-center">
        <div
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wider",
            status === "ok" && "bg-success/15 text-success",
            status === "warn" && "bg-yellow-500/15 text-yellow-500",
            status === "fail" && "bg-danger/15 text-danger",
            status === "unknown" && "bg-muted/15 text-muted",
          )}
        >
          {label}
        </div>
      </div>
    </WidgetFrame>
  );
}

type Status = "ok" | "warn" | "fail" | "unknown";

function stateOf(v: unknown): Status {
  if (v === true || v === "ok" || v === "up" || v === "healthy" || v === 1 || v === "200") return "ok";
  if (v === "warn" || v === "warning" || v === "degraded") return "warn";
  if (v === false || v === "fail" || v === "down" || v === "error" || v === 0) return "fail";
  return "unknown";
}

function defaultLabel(s: Status): string {
  return { ok: "OK", warn: "Varning", fail: "Fel", unknown: "Okänd" }[s];
}
