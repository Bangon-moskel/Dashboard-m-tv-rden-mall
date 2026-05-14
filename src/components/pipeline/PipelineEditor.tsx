"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
import { useDashboard } from "@/lib/store";
import type { NodeKind, PipelineNode } from "@/lib/types";
import { nodeKindLabel } from "@/lib/types";
import { PipelineFlowNode } from "./PipelineNode";
import { NodeInspector } from "./NodeInspector";
import { Button } from "@/components/ui/Button";
import { Plus, Play } from "lucide-react";
import { getScheduler } from "@/lib/runtime/scheduler";
import { uid } from "@/lib/utils";

const nodeTypes = { pipeline: PipelineFlowNode };

const AVAILABLE_KINDS: NodeKind[] = [
  "http",
  "static",
  "jsonpath",
  "expr",
  "schedule",
  "output",
];

interface Props {
  pipelineId: string;
}

export function PipelineEditor({ pipelineId }: Props) {
  return (
    <ReactFlowProvider>
      <PipelineEditorInner pipelineId={pipelineId} />
    </ReactFlowProvider>
  );
}

function PipelineEditorInner({ pipelineId }: Props) {
  const pipeline = useDashboard((s) =>
    s.config.pipelines.find((p) => p.id === pipelineId),
  );
  const updatePipeline = useDashboard((s) => s.updatePipeline);
  const setPipelineNodes = useDashboard((s) => s.setPipelineNodes);
  const setPipelineEdges = useDashboard((s) => s.setPipelineEdges);
  const addPipelineNode = useDashboard((s) => s.addPipelineNode);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastErrors, setLastErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!pipeline) return;
    const unsubscribe = getScheduler().subscribe(pipeline, (r) => {
      setLastErrors(r.errors);
    });
    return () => unsubscribe();
  }, [pipeline]);

  const flowNodes: Node[] = useMemo(() => {
    if (!pipeline) return [];
    return pipeline.nodes.map((n) => ({
      id: n.id,
      type: "pipeline",
      position: n.position,
      data: {
        kind: n.kind,
        label: n.label,
        hasError: !!lastErrors[n.id],
        preview: previewFor(n),
      },
    }));
  }, [pipeline, lastErrors]);

  const flowEdges: Edge[] = useMemo(() => {
    if (!pipeline) return [];
    return pipeline.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      style: { stroke: "rgb(var(--accent))" },
    }));
  }, [pipeline]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!pipeline) return;
      const next = applyNodeChanges(changes, flowNodes);
      const merged: PipelineNode[] = pipeline.nodes.map((orig) => {
        const updated = next.find((n) => n.id === orig.id);
        if (!updated) return orig;
        return { ...orig, position: updated.position };
      });
      const kept = merged.filter((n) => next.some((x) => x.id === n.id));
      setPipelineNodes(pipeline.id, kept);
    },
    [pipeline, flowNodes, setPipelineNodes],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!pipeline) return;
      const next = applyEdgeChanges(changes, flowEdges);
      setPipelineEdges(
        pipeline.id,
        next.map((e) => ({ id: e.id, source: e.source, target: e.target })),
      );
    },
    [pipeline, flowEdges, setPipelineEdges],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!pipeline) return;
      const next = addEdge({ ...params, id: uid("e") }, flowEdges);
      setPipelineEdges(
        pipeline.id,
        next.map((e) => ({ id: e.id, source: e.source!, target: e.target! })),
      );
    },
    [pipeline, flowEdges, setPipelineEdges],
  );

  if (!pipeline) {
    return <div className="p-8 text-muted">Pipeline hittades inte.</div>;
  }

  const selected = pipeline.nodes.find((n) => n.id === selectedId) ?? null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full">
      <aside className="w-56 border-r border-border bg-panel flex flex-col">
        <div className="p-3 border-b border-border">
          <input
            value={pipeline.name}
            onChange={(e) => updatePipeline(pipeline.id, { name: e.target.value })}
            className="bg-transparent text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-accent/40 rounded px-1 w-full"
          />
        </div>
        <div className="p-3 flex flex-col gap-1 overflow-y-auto">
          <div className="text-xs text-muted uppercase tracking-wider mb-1">Lägg till</div>
          {AVAILABLE_KINDS.map((kind) => (
            <button
              key={kind}
              onClick={() => addPipelineNode(pipeline.id, kind)}
              className="flex items-center gap-2 text-left text-sm px-2 py-1.5 rounded hover:bg-border/40"
            >
              <Plus className="size-3.5 text-muted" />
              {nodeKindLabel(kind)}
            </button>
          ))}
        </div>
        <div className="mt-auto p-3 border-t border-border">
          <Button
            size="sm"
            variant="primary"
            className="w-full"
            onClick={() => getScheduler().refresh(pipeline.id)}
          >
            <Play className="size-3.5" /> Kör nu
          </Button>
        </div>
      </aside>
      <div className="flex-1 relative">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, n) => setSelectedId(n.id)}
          onPaneClick={() => setSelectedId(null)}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} color="rgb(var(--border))" />
          <Controls />
          <MiniMap pannable zoomable nodeColor={() => "rgb(var(--accent) / 0.5)"} maskColor="rgb(0 0 0 / 0.2)" />
        </ReactFlow>
      </div>
      <aside className="w-80 border-l border-border bg-panel">
        <NodeInspector pipelineId={pipeline.id} node={selected} />
      </aside>
    </div>
  );
}

function previewFor(node: PipelineNode): string {
  switch (node.kind) {
    case "http":
      return (node.config as { url: string }).url;
    case "schedule":
      return `var ${(node.config as { intervalSeconds: number }).intervalSeconds}s`;
    case "jsonpath":
      return (node.config as { expression: string }).expression;
    case "expr":
      return (node.config as { expression: string }).expression;
    case "static":
      return "JSON";
    case "output":
      return `→ ${(node.config as { bind: string }).bind}`;
  }
}

