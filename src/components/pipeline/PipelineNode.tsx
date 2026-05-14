"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Globe,
  Database,
  Filter,
  Calculator,
  Clock,
  Target,
  AlertCircle,
} from "lucide-react";
import type { NodeKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<NodeKind, React.ComponentType<{ className?: string }>> = {
  http: Globe,
  static: Database,
  jsonpath: Filter,
  expr: Calculator,
  schedule: Clock,
  output: Target,
};

export interface FlowNodeData extends Record<string, unknown> {
  kind: NodeKind;
  label: string;
  selected?: boolean;
  hasError?: boolean;
  preview?: string;
}

export function PipelineFlowNode({ data, selected }: NodeProps) {
  const d = data as FlowNodeData;
  const Icon = ICONS[d.kind];
  const isSource = d.kind === "schedule";
  const isSink = d.kind === "output";

  return (
    <div
      className={cn(
        "rounded-lg border bg-panel shadow-sm min-w-[180px]",
        selected ? "border-accent ring-2 ring-accent/30" : "border-border",
        d.hasError && "border-danger",
      )}
    >
      {!isSource && <Handle type="target" position={Position.Left} />}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <Icon className="size-4 text-accent" />
        <span className="text-sm font-medium truncate flex-1">{d.label}</span>
        {d.hasError && <AlertCircle className="size-3.5 text-danger" />}
      </div>
      <div className="px-3 py-2 text-xs text-muted truncate">
        {d.preview ?? labelFor(d.kind)}
      </div>
      {!isSink && <Handle type="source" position={Position.Right} />}
    </div>
  );
}

function labelFor(kind: NodeKind): string {
  return {
    http: "HTTP-anrop",
    static: "Statisk JSON",
    jsonpath: "Filtrera data",
    expr: "Räkna värde",
    schedule: "Polling",
    output: "Bind till widget",
  }[kind];
}
