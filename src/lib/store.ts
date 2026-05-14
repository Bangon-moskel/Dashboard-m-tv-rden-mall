"use client";

import { create } from "zustand";
import {
  emptyDashboard,
  defaultConfigFor,
  type DashboardConfig,
  type Pipeline,
  type PipelineEdge,
  type PipelineNode,
  type Widget,
  type WidgetKind,
} from "@/lib/types";
import { getStore } from "@/lib/storage";
import { uid } from "@/lib/utils";

interface DashboardState {
  config: DashboardConfig;
  hydrated: boolean;
  editMode: boolean;
  hydrate: () => Promise<void>;
  setEditMode: (on: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  setDashboardName: (name: string) => void;
  addWidget: (kind: WidgetKind) => Widget;
  updateWidget: (id: string, patch: Partial<Widget>) => void;
  removeWidget: (id: string) => void;
  setWidgetLayouts: (layouts: { i: string; x: number; y: number; w: number; h: number }[]) => void;
  createPipelineForWidget: (widgetId: string) => Pipeline;
  getPipeline: (id: string) => Pipeline | undefined;
  updatePipeline: (id: string, patch: Partial<Pipeline>) => void;
  setPipelineNodes: (pipelineId: string, nodes: PipelineNode[]) => void;
  setPipelineEdges: (pipelineId: string, edges: PipelineEdge[]) => void;
  addPipelineNode: (pipelineId: string, kind: PipelineNode["kind"]) => PipelineNode;
  updatePipelineNode: (pipelineId: string, nodeId: string, patch: Partial<PipelineNode>) => void;
  removePipelineNode: (pipelineId: string, nodeId: string) => void;
  importConfig: (next: DashboardConfig) => void;
  resetConfig: () => void;
}

function persist(config: DashboardConfig) {
  if (typeof window === "undefined") return;
  void getStore().save(config);
}

const defaultLayoutFor = (kind: WidgetKind) => {
  switch (kind) {
    case "kpi":
    case "status":
      return { x: 0, y: Infinity, w: 3, h: 2 };
    case "line":
    case "bar":
      return { x: 0, y: Infinity, w: 6, h: 4 };
    case "table":
      return { x: 0, y: Infinity, w: 6, h: 4 };
  }
};

export const useDashboard = create<DashboardState>((set, get) => ({
  config: emptyDashboard(),
  hydrated: false,
  editMode: false,

  hydrate: async () => {
    if (typeof window === "undefined") return;
    const loaded = await getStore().load();
    set({ config: loaded ?? emptyDashboard(), hydrated: true });
  },

  setEditMode: (on) => set({ editMode: on }),

  setTheme: (theme) =>
    set((s) => {
      const next = { ...s.config, theme };
      persist(next);
      return { config: next };
    }),

  setDashboardName: (name) =>
    set((s) => {
      const next = { ...s.config, name };
      persist(next);
      return { config: next };
    }),

  addWidget: (kind) => {
    const widget: Widget = {
      id: uid("w"),
      kind,
      title: kindTitle(kind),
      pipelineId: null,
      layout: defaultLayoutFor(kind),
    };
    set((s) => {
      const next = { ...s.config, widgets: [...s.config.widgets, widget] };
      persist(next);
      return { config: next };
    });
    return widget;
  },

  updateWidget: (id, patch) =>
    set((s) => {
      const widgets = s.config.widgets.map((w) => (w.id === id ? { ...w, ...patch } : w));
      const next = { ...s.config, widgets };
      persist(next);
      return { config: next };
    }),

  removeWidget: (id) =>
    set((s) => {
      const widget = s.config.widgets.find((w) => w.id === id);
      const widgets = s.config.widgets.filter((w) => w.id !== id);
      let pipelines = s.config.pipelines;
      if (widget?.pipelineId) {
        const used = widgets.some((w) => w.pipelineId === widget.pipelineId);
        if (!used) pipelines = pipelines.filter((p) => p.id !== widget.pipelineId);
      }
      const next = { ...s.config, widgets, pipelines };
      persist(next);
      return { config: next };
    }),

  setWidgetLayouts: (layouts) =>
    set((s) => {
      const byId = new Map(layouts.map((l) => [l.i, l]));
      const widgets = s.config.widgets.map((w) => {
        const l = byId.get(w.id);
        if (!l) return w;
        return { ...w, layout: { x: l.x, y: l.y, w: l.w, h: l.h } };
      });
      const next = { ...s.config, widgets };
      persist(next);
      return { config: next };
    }),

  createPipelineForWidget: (widgetId) => {
    const widget = get().config.widgets.find((w) => w.id === widgetId);
    const pipeline: Pipeline = {
      id: uid("p"),
      name: widget ? `${widget.title}-pipeline` : "Ny pipeline",
      nodes: [
        {
          id: uid("n"),
          kind: "schedule",
          label: "Schemaläggning",
          position: { x: 40, y: 40 },
          config: defaultConfigFor("schedule"),
        },
        {
          id: uid("n"),
          kind: "http",
          label: "HTTP-anrop",
          position: { x: 280, y: 40 },
          config: defaultConfigFor("http"),
        },
        {
          id: uid("n"),
          kind: "jsonpath",
          label: "JSONPath",
          position: { x: 540, y: 40 },
          config: defaultConfigFor("jsonpath"),
        },
        {
          id: uid("n"),
          kind: "output",
          label: "Output",
          position: { x: 800, y: 40 },
          config: defaultConfigFor("output"),
        },
      ],
      edges: [],
    };
    pipeline.edges = [
      { id: uid("e"), source: pipeline.nodes[1].id, target: pipeline.nodes[2].id },
      { id: uid("e"), source: pipeline.nodes[2].id, target: pipeline.nodes[3].id },
    ];
    set((s) => {
      const widgets = s.config.widgets.map((w) =>
        w.id === widgetId ? { ...w, pipelineId: pipeline.id } : w,
      );
      const next = { ...s.config, widgets, pipelines: [...s.config.pipelines, pipeline] };
      persist(next);
      return { config: next };
    });
    return pipeline;
  },

  getPipeline: (id) => get().config.pipelines.find((p) => p.id === id),

  updatePipeline: (id, patch) =>
    set((s) => {
      const pipelines = s.config.pipelines.map((p) => (p.id === id ? { ...p, ...patch } : p));
      const next = { ...s.config, pipelines };
      persist(next);
      return { config: next };
    }),

  setPipelineNodes: (pipelineId, nodes) =>
    set((s) => {
      const pipelines = s.config.pipelines.map((p) =>
        p.id === pipelineId ? { ...p, nodes } : p,
      );
      const next = { ...s.config, pipelines };
      persist(next);
      return { config: next };
    }),

  setPipelineEdges: (pipelineId, edges) =>
    set((s) => {
      const pipelines = s.config.pipelines.map((p) =>
        p.id === pipelineId ? { ...p, edges } : p,
      );
      const next = { ...s.config, pipelines };
      persist(next);
      return { config: next };
    }),

  addPipelineNode: (pipelineId, kind) => {
    const node: PipelineNode = {
      id: uid("n"),
      kind,
      label: defaultLabel(kind),
      position: { x: 200, y: 200 },
      config: defaultConfigFor(kind),
    };
    set((s) => {
      const pipelines = s.config.pipelines.map((p) =>
        p.id === pipelineId ? { ...p, nodes: [...p.nodes, node] } : p,
      );
      const next = { ...s.config, pipelines };
      persist(next);
      return { config: next };
    });
    return node;
  },

  updatePipelineNode: (pipelineId, nodeId, patch) =>
    set((s) => {
      const pipelines = s.config.pipelines.map((p) => {
        if (p.id !== pipelineId) return p;
        return {
          ...p,
          nodes: p.nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)),
        };
      });
      const next = { ...s.config, pipelines };
      persist(next);
      return { config: next };
    }),

  removePipelineNode: (pipelineId, nodeId) =>
    set((s) => {
      const pipelines = s.config.pipelines.map((p) => {
        if (p.id !== pipelineId) return p;
        return {
          ...p,
          nodes: p.nodes.filter((n) => n.id !== nodeId),
          edges: p.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
        };
      });
      const next = { ...s.config, pipelines };
      persist(next);
      return { config: next };
    }),

  importConfig: (next) => {
    persist(next);
    set({ config: next });
  },

  resetConfig: () => {
    const empty = emptyDashboard();
    persist(empty);
    set({ config: empty });
  },
}));

function kindTitle(kind: WidgetKind): string {
  return {
    kpi: "KPI",
    line: "Linjediagram",
    bar: "Stapeldiagram",
    table: "Tabell",
    status: "Status",
  }[kind];
}

function defaultLabel(kind: PipelineNode["kind"]): string {
  return {
    http: "HTTP-anrop",
    static: "Statisk JSON",
    jsonpath: "JSONPath",
    expr: "Uttryck",
    schedule: "Schemaläggning",
    output: "Output",
  }[kind];
}
