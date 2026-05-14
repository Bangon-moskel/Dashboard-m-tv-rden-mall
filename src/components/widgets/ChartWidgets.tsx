"use client";

import {
  LineChart as RLineChart,
  BarChart as RBarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { Widget } from "@/lib/types";
import { WidgetFrame } from "./WidgetFrame";
import { usePipelineData } from "./usePipelineData";

interface Point {
  name: string;
  value: number;
}

function toSeries(input: unknown): Point[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item, index): Point | null => {
      if (typeof item === "number") return { name: String(index), value: item };
      if (item && typeof item === "object") {
        const rec = item as Record<string, unknown>;
        const name =
          (rec.name as string | undefined) ??
          (rec.label as string | undefined) ??
          (rec.x as string | undefined) ??
          (rec.timestamp as string | undefined) ??
          String(index);
        const valueRaw =
          rec.value ?? rec.y ?? rec.count ?? rec.total ?? rec.amount;
        const value = typeof valueRaw === "number" ? valueRaw : Number(valueRaw);
        if (!Number.isFinite(value)) return null;
        return { name: String(name), value };
      }
      return null;
    })
    .filter((p): p is Point => p !== null);
}

export function LineChartWidget({ widget, editMode }: { widget: Widget; editMode: boolean }) {
  const { bound, loading, errorSummary } = usePipelineData(widget.pipelineId);
  const series = toSeries(bound.series ?? bound.value);

  return (
    <WidgetFrame
      widgetId={widget.id}
      title={widget.title}
      pipelineId={widget.pipelineId}
      editMode={editMode}
      error={errorSummary}
      loading={loading}
    >
      <ChartContainer empty={series.length === 0}>
        <RLineChart data={series}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
          <XAxis dataKey="name" stroke="rgb(var(--muted))" fontSize={11} />
          <YAxis stroke="rgb(var(--muted))" fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="value" stroke="rgb(var(--accent))" strokeWidth={2} dot={false} />
        </RLineChart>
      </ChartContainer>
    </WidgetFrame>
  );
}

export function BarChartWidget({ widget, editMode }: { widget: Widget; editMode: boolean }) {
  const { bound, loading, errorSummary } = usePipelineData(widget.pipelineId);
  const series = toSeries(bound.series ?? bound.value);

  return (
    <WidgetFrame
      widgetId={widget.id}
      title={widget.title}
      pipelineId={widget.pipelineId}
      editMode={editMode}
      error={errorSummary}
      loading={loading}
    >
      <ChartContainer empty={series.length === 0}>
        <RBarChart data={series}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
          <XAxis dataKey="name" stroke="rgb(var(--muted))" fontSize={11} />
          <YAxis stroke="rgb(var(--muted))" fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="value" fill="rgb(var(--accent))" />
        </RBarChart>
      </ChartContainer>
    </WidgetFrame>
  );
}

const tooltipStyle = {
  backgroundColor: "rgb(var(--panel))",
  border: "1px solid rgb(var(--border))",
  borderRadius: "0.375rem",
  fontSize: "0.75rem",
};

function ChartContainer({
  children,
  empty,
}: {
  children: React.ReactElement;
  empty: boolean;
}) {
  if (empty) {
    return <div className="text-muted text-sm">Ingen serie att visa</div>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      {children}
    </ResponsiveContainer>
  );
}
