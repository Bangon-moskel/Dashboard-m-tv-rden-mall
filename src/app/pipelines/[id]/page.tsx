"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PipelineEditor } from "@/components/pipeline/PipelineEditor";
import { useDashboard } from "@/lib/store";

export default function PipelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const hydrated = useDashboard((s) => s.hydrated);
  const pipeline = useDashboard((s) =>
    s.config.pipelines.find((p) => p.id === id),
  );

  return (
    <main>
      <div className="sticky top-0 z-20 border-b border-border bg-panel/80 backdrop-blur">
        <div className="flex items-center gap-3 px-6 h-14">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted hover:text-fg">
            <ArrowLeft className="size-4" /> Tillbaka till dashboard
          </Link>
          <span className="ml-3 text-sm font-medium">
            {pipeline?.name ?? "Pipeline"}
          </span>
        </div>
      </div>
      {!hydrated ? (
        <div className="p-12 text-muted">Laddar pipeline…</div>
      ) : pipeline ? (
        <PipelineEditor pipelineId={id} />
      ) : (
        <div className="p-12 text-muted">
          Pipeline finns inte. <Link href="/" className="text-accent">Tillbaka</Link>.
        </div>
      )}
    </main>
  );
}
