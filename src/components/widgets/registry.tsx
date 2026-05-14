"use client";

import type { Widget, WidgetKind } from "@/lib/types";
import { KpiWidget } from "./KpiWidget";
import { LineChartWidget, BarChartWidget } from "./ChartWidgets";
import { TableWidget } from "./TableWidget";
import { StatusWidget } from "./StatusWidget";

type Renderer = (props: { widget: Widget; editMode: boolean }) => React.ReactElement;

const REGISTRY: Record<WidgetKind, Renderer> = {
  kpi: KpiWidget,
  line: LineChartWidget,
  bar: BarChartWidget,
  table: TableWidget,
  status: StatusWidget,
};

export function renderWidget(widget: Widget, editMode: boolean): React.ReactElement {
  const Renderer = REGISTRY[widget.kind];
  return <Renderer widget={widget} editMode={editMode} />;
}
