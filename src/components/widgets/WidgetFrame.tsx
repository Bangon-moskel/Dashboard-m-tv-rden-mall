"use client";

import Link from "next/link";
import { RefreshCw, Settings, X, AlertCircle } from "lucide-react";
import { useDashboard } from "@/lib/store";
import { getScheduler } from "@/lib/runtime/scheduler";

interface Props {
  widgetId: string;
  title: string;
  pipelineId: string | null;
  editMode: boolean;
  error?: string | null;
  loading?: boolean;
  children: React.ReactNode;
}

export function WidgetFrame({
  widgetId,
  title,
  pipelineId,
  editMode,
  error,
  loading,
  children,
}: Props) {
  const removeWidget = useDashboard((s) => s.removeWidget);
  const updateWidget = useDashboard((s) => s.updateWidget);

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-panel shadow-sm overflow-hidden">
      <div className="drag-handle flex items-center gap-2 px-3 py-2 border-b border-border cursor-move bg-panel">
        {editMode ? (
          <input
            value={title}
            onChange={(e) => updateWidget(widgetId, { title: e.target.value })}
            onMouseDown={(e) => e.stopPropagation()}
            className="bg-transparent text-sm font-medium focus:outline-none focus:ring-1 focus:ring-accent/40 rounded px-1 flex-1 min-w-0"
          />
        ) : (
          <span className="text-sm font-medium truncate flex-1 min-w-0">{title}</span>
        )}
        <button
          className="text-muted hover:text-fg p-1"
          title="Uppdatera"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => pipelineId && getScheduler().refresh(pipelineId)}
        >
          <RefreshCw className="size-3.5" />
        </button>
        {editMode && pipelineId && (
          <Link
            href={`/pipelines/${pipelineId}`}
            className="text-muted hover:text-fg p-1"
            title="Redigera pipeline"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Settings className="size-3.5" />
          </Link>
        )}
        {editMode && (
          <button
            className="text-muted hover:text-danger p-1"
            title="Ta bort"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => {
              if (confirm(`Ta bort "${title}"?`)) removeWidget(widgetId);
            }}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <div className="relative flex-1 min-h-0 p-3">
        {error ? (
          <div className="flex items-center gap-2 text-danger text-sm">
            <AlertCircle className="size-4 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        ) : loading ? (
          <div className="text-muted text-sm">Laddar…</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
