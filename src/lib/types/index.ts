import { z } from "zod";

export const WidgetKindSchema = z.enum([
  "kpi",
  "line",
  "bar",
  "table",
  "status",
]);
export type WidgetKind = z.infer<typeof WidgetKindSchema>;

export const NodeKindSchema = z.enum([
  "http",
  "static",
  "jsonpath",
  "expr",
  "schedule",
  "output",
]);
export type NodeKind = z.infer<typeof NodeKindSchema>;

export const HttpConfigSchema = z.object({
  url: z.string().url().or(z.string().startsWith("/")),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("GET"),
  headers: z.record(z.string()).default({}),
  body: z.string().optional(),
  auth: z
    .discriminatedUnion("kind", [
      z.object({ kind: z.literal("none") }),
      z.object({ kind: z.literal("bearer"), token: z.string() }),
      z.object({
        kind: z.literal("basic"),
        username: z.string(),
        password: z.string(),
      }),
    ])
    .default({ kind: "none" }),
  useProxy: z.boolean().default(true),
});
export type HttpConfig = z.infer<typeof HttpConfigSchema>;

export const ScheduleConfigSchema = z.object({
  intervalSeconds: z.number().int().positive().default(60),
});
export type ScheduleConfig = z.infer<typeof ScheduleConfigSchema>;

export const JsonPathConfigSchema = z.object({
  expression: z.string().default("$"),
});
export type JsonPathConfig = z.infer<typeof JsonPathConfigSchema>;

export const ExprConfigSchema = z.object({
  expression: z.string().default("value"),
});
export type ExprConfig = z.infer<typeof ExprConfigSchema>;

export const StaticConfigSchema = z.object({
  json: z.string().default("{}"),
});
export type StaticConfig = z.infer<typeof StaticConfigSchema>;

export const OutputConfigSchema = z.object({
  bind: z.enum(["value", "series", "rows", "label", "status"]).default("value"),
});
export type OutputConfig = z.infer<typeof OutputConfigSchema>;

export type NodeConfig =
  | HttpConfig
  | ScheduleConfig
  | JsonPathConfig
  | ExprConfig
  | StaticConfig
  | OutputConfig;

export interface PipelineNode {
  id: string;
  kind: NodeKind;
  label: string;
  position: { x: number; y: number };
  config: NodeConfig;
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
}

export interface Pipeline {
  id: string;
  name: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

export interface Widget {
  id: string;
  kind: WidgetKind;
  title: string;
  pipelineId: string | null;
  layout: { x: number; y: number; w: number; h: number };
  options?: Record<string, unknown>;
}

export interface DashboardConfig {
  id: string;
  name: string;
  widgets: Widget[];
  pipelines: Pipeline[];
  theme: "light" | "dark";
  version: number;
}

export const DASHBOARD_VERSION = 1;

export function emptyDashboard(): DashboardConfig {
  return {
    id: "default",
    name: "Min dashboard",
    widgets: [],
    pipelines: [],
    theme: "dark",
    version: DASHBOARD_VERSION,
  };
}

export function defaultConfigFor(kind: NodeKind): NodeConfig {
  switch (kind) {
    case "http":
      return {
        url: "https://jsonplaceholder.typicode.com/users/1",
        method: "GET",
        headers: {},
        auth: { kind: "none" },
        useProxy: true,
      };
    case "schedule":
      return { intervalSeconds: 60 };
    case "jsonpath":
      return { expression: "$" };
    case "expr":
      return { expression: "value" };
    case "static":
      return { json: "{}" };
    case "output":
      return { bind: "value" };
  }
}

export function nodeKindLabel(kind: NodeKind): string {
  return {
    http: "HTTP-anrop",
    static: "Statisk JSON",
    jsonpath: "JSONPath",
    expr: "Uttryck",
    schedule: "Schemaläggning",
    output: "Output",
  }[kind];
}

export function widgetKindLabel(kind: WidgetKind): string {
  return {
    kpi: "KPI",
    line: "Linjediagram",
    bar: "Stapeldiagram",
    table: "Tabell",
    status: "Status",
  }[kind];
}
