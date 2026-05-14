"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "@/lib/store";
import { getScheduler } from "@/lib/runtime/scheduler";
import type { ExecutionResult } from "@/lib/runtime/executor";
import type { OutputConfig } from "@/lib/types";

export interface PipelineData {
  loading: boolean;
  result: ExecutionResult | null;
  bound: Record<OutputConfig["bind"], unknown>;
  errorSummary: string | null;
}

export function usePipelineData(pipelineId: string | null): PipelineData {
  const pipeline = useDashboard((s) =>
    pipelineId ? s.config.pipelines.find((p) => p.id === pipelineId) : undefined,
  );
  const [result, setResult] = useState<ExecutionResult | null>(null);

  useEffect(() => {
    if (!pipeline) {
      setResult(null);
      return;
    }
    const unsubscribe = getScheduler().subscribe(pipeline, (r) => setResult(r));
    return () => unsubscribe();
  }, [pipeline]);

  const bound: Record<OutputConfig["bind"], unknown> = {
    value: undefined,
    series: undefined,
    rows: undefined,
    label: undefined,
    status: undefined,
  };
  if (result) {
    for (const o of Object.values(result.outputs)) {
      bound[o.bind] = o.value;
    }
  }

  const errorSummary = result && Object.keys(result.errors).length > 0
    ? Object.values(result.errors)[0]
    : null;

  return {
    loading: !result && !!pipeline,
    result,
    bound,
    errorSummary,
  };
}
