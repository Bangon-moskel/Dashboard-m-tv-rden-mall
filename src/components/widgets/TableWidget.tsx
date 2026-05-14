"use client";

import type { Widget } from "@/lib/types";
import { WidgetFrame } from "./WidgetFrame";
import { usePipelineData } from "./usePipelineData";

export function TableWidget({ widget, editMode }: { widget: Widget; editMode: boolean }) {
  const { bound, loading, errorSummary } = usePipelineData(widget.pipelineId);
  const rows = (bound.rows ?? bound.value) as unknown;
  const data = Array.isArray(rows) ? rows : [];

  const columns = inferColumns(data);

  return (
    <WidgetFrame
      widgetId={widget.id}
      title={widget.title}
      pipelineId={widget.pipelineId}
      editMode={editMode}
      error={errorSummary}
      loading={loading}
    >
      {data.length === 0 ? (
        <div className="text-muted text-sm">Inga rader</div>
      ) : (
        <div className="h-full overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-panel">
              <tr className="text-left text-muted">
                {columns.map((c) => (
                  <th key={c} className="px-2 py-1 font-medium border-b border-border">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 200).map((row, i) => (
                <tr key={i} className="border-b border-border/50">
                  {columns.map((c) => (
                    <td key={c} className="px-2 py-1 truncate max-w-[200px]">
                      {stringify((row as Record<string, unknown>)[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WidgetFrame>
  );
}

function inferColumns(rows: unknown[]): string[] {
  const set = new Set<string>();
  for (const row of rows.slice(0, 20)) {
    if (row && typeof row === "object" && !Array.isArray(row)) {
      for (const key of Object.keys(row)) set.add(key);
    }
  }
  return Array.from(set);
}

function stringify(v: unknown): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
