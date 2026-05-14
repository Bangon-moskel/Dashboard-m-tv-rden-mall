import type {
  ExprConfig,
  HttpConfig,
  JsonPathConfig,
  OutputConfig,
  Pipeline,
  PipelineNode,
  StaticConfig,
} from "@/lib/types";
import { applyExpression, applyJsonPath } from "./transforms";

export interface ExecutionResult {
  outputs: Record<string, { bind: OutputConfig["bind"]; value: unknown }>;
  nodeValues: Record<string, unknown>;
  errors: Record<string, string>;
}

function topologicalOrder(pipeline: Pipeline): PipelineNode[] {
  const indegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const node of pipeline.nodes) {
    indegree.set(node.id, 0);
    adj.set(node.id, []);
  }
  for (const edge of pipeline.edges) {
    if (!indegree.has(edge.target) || !adj.has(edge.source)) continue;
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
    adj.get(edge.source)!.push(edge.target);
  }
  const queue = pipeline.nodes.filter((n) => (indegree.get(n.id) ?? 0) === 0);
  const order: PipelineNode[] = [];
  const byId = new Map(pipeline.nodes.map((n) => [n.id, n]));
  while (queue.length > 0) {
    const node = queue.shift()!;
    order.push(node);
    for (const next of adj.get(node.id) ?? []) {
      const nextDeg = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, nextDeg);
      if (nextDeg === 0) {
        const target = byId.get(next);
        if (target) queue.push(target);
      }
    }
  }
  return order;
}

function predecessorsOf(pipeline: Pipeline, nodeId: string): string[] {
  return pipeline.edges.filter((e) => e.target === nodeId).map((e) => e.source);
}

async function runHttp(cfg: HttpConfig): Promise<unknown> {
  const init: RequestInit = {
    method: cfg.method,
    headers: { ...cfg.headers },
  };
  if (cfg.body && cfg.method !== "GET") {
    init.body = cfg.body;
    if (!("content-type" in (init.headers as Record<string, string>))) {
      (init.headers as Record<string, string>)["content-type"] = "application/json";
    }
  }
  if (cfg.auth.kind === "bearer") {
    (init.headers as Record<string, string>)["authorization"] = `Bearer ${cfg.auth.token}`;
  } else if (cfg.auth.kind === "basic") {
    const encoded = typeof window !== "undefined"
      ? btoa(`${cfg.auth.username}:${cfg.auth.password}`)
      : Buffer.from(`${cfg.auth.username}:${cfg.auth.password}`).toString("base64");
    (init.headers as Record<string, string>)["authorization"] = `Basic ${encoded}`;
  }
  const target = cfg.useProxy
    ? `/api/proxy?url=${encodeURIComponent(cfg.url)}`
    : cfg.url;
  const res = await fetch(target, init);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function executePipeline(pipeline: Pipeline): Promise<ExecutionResult> {
  const order = topologicalOrder(pipeline);
  const nodeValues: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  const outputs: ExecutionResult["outputs"] = {};

  const inputFor = (nodeId: string): unknown => {
    const preds = predecessorsOf(pipeline, nodeId).filter(
      (id) => pipeline.nodes.find((n) => n.id === id)?.kind !== "schedule",
    );
    if (preds.length === 0) return undefined;
    if (preds.length === 1) return nodeValues[preds[0]];
    return preds.map((id) => nodeValues[id]);
  };

  for (const node of order) {
    try {
      switch (node.kind) {
        case "schedule":
          nodeValues[node.id] = null;
          break;
        case "static": {
          const cfg = node.config as StaticConfig;
          nodeValues[node.id] = JSON.parse(cfg.json || "null");
          break;
        }
        case "http": {
          const cfg = node.config as HttpConfig;
          nodeValues[node.id] = await runHttp(cfg);
          break;
        }
        case "jsonpath": {
          const cfg = node.config as JsonPathConfig;
          nodeValues[node.id] = applyJsonPath(inputFor(node.id), cfg.expression);
          break;
        }
        case "expr": {
          const cfg = node.config as ExprConfig;
          nodeValues[node.id] = applyExpression(inputFor(node.id), cfg.expression);
          break;
        }
        case "output": {
          const cfg = node.config as OutputConfig;
          const value = inputFor(node.id);
          nodeValues[node.id] = value;
          outputs[node.id] = { bind: cfg.bind, value };
          break;
        }
      }
    } catch (err) {
      errors[node.id] = err instanceof Error ? err.message : String(err);
      nodeValues[node.id] = undefined;
    }
  }

  return { outputs, nodeValues, errors };
}

export function defaultIntervalSeconds(pipeline: Pipeline): number | null {
  const sched = pipeline.nodes.find((n) => n.kind === "schedule");
  if (!sched) return null;
  return (sched.config as { intervalSeconds: number }).intervalSeconds;
}
