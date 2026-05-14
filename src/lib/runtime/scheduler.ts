import type { Pipeline } from "@/lib/types";
import { defaultIntervalSeconds, executePipeline, type ExecutionResult } from "./executor";

type Listener = (result: ExecutionResult) => void;

interface RunHandle {
  pipelineId: string;
  intervalMs: number;
  timer: ReturnType<typeof setInterval> | null;
  listeners: Set<Listener>;
  lastResult: ExecutionResult | null;
  pipeline: Pipeline;
  running: boolean;
}

class Scheduler {
  private handles = new Map<string, RunHandle>();

  subscribe(pipeline: Pipeline, listener: Listener): () => void {
    let handle = this.handles.get(pipeline.id);
    const intervalSec = defaultIntervalSeconds(pipeline) ?? 60;
    const intervalMs = Math.max(1000, intervalSec * 1000);

    if (!handle) {
      handle = {
        pipelineId: pipeline.id,
        intervalMs,
        timer: null,
        listeners: new Set(),
        lastResult: null,
        pipeline,
        running: false,
      };
      this.handles.set(pipeline.id, handle);
    } else {
      handle.pipeline = pipeline;
      if (handle.intervalMs !== intervalMs) {
        handle.intervalMs = intervalMs;
        if (handle.timer) {
          clearInterval(handle.timer);
          handle.timer = null;
        }
      }
    }

    handle.listeners.add(listener);
    if (handle.lastResult) listener(handle.lastResult);
    this.tick(handle);
    this.ensureTimer(handle);

    return () => {
      const h = this.handles.get(pipeline.id);
      if (!h) return;
      h.listeners.delete(listener);
      if (h.listeners.size === 0) {
        if (h.timer) clearInterval(h.timer);
        this.handles.delete(pipeline.id);
      }
    };
  }

  refresh(pipelineId: string): void {
    const handle = this.handles.get(pipelineId);
    if (handle) this.tick(handle);
  }

  private ensureTimer(handle: RunHandle): void {
    if (handle.timer) return;
    handle.timer = setInterval(() => this.tick(handle), handle.intervalMs);
  }

  private async tick(handle: RunHandle): Promise<void> {
    if (handle.running) return;
    handle.running = true;
    try {
      const result = await executePipeline(handle.pipeline);
      handle.lastResult = result;
      handle.listeners.forEach((l) => l(result));
    } finally {
      handle.running = false;
    }
  }
}

let singleton: Scheduler | null = null;
export function getScheduler(): Scheduler {
  if (!singleton) singleton = new Scheduler();
  return singleton;
}
