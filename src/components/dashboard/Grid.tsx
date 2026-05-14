"use client";

import { useMemo } from "react";
import GridLayout, { WidthProvider, type Layout } from "react-grid-layout";
import { useDashboard } from "@/lib/store";
import { renderWidget } from "@/components/widgets/registry";

const ResponsiveGrid = WidthProvider(GridLayout);

export function DashboardGrid() {
  const widgets = useDashboard((s) => s.config.widgets);
  const editMode = useDashboard((s) => s.editMode);
  const setWidgetLayouts = useDashboard((s) => s.setWidgetLayouts);

  const layouts: Layout[] = useMemo(
    () =>
      widgets.map((w) => ({
        i: w.id,
        x: w.layout.x,
        y: w.layout.y,
        w: w.layout.w,
        h: w.layout.h,
        minW: 2,
        minH: 2,
      })),
    [widgets],
  );

  if (widgets.length === 0) {
    return (
      <div className="px-6 py-24 text-center text-muted">
        <p className="text-lg mb-2">Inga widgets än</p>
        <p className="text-sm">
          {editMode
            ? "Klicka på \"Lägg till widget\" i toppen för att börja."
            : "Slå på redigeringsläge och lägg till din första widget."}
        </p>
      </div>
    );
  }

  return (
    <ResponsiveGrid
      className="layout"
      layout={layouts}
      cols={12}
      rowHeight={60}
      margin={[16, 16]}
      containerPadding={[24, 16]}
      isDraggable={editMode}
      isResizable={editMode}
      draggableHandle=".drag-handle"
      onLayoutChange={(l) => setWidgetLayouts(l.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })))}
    >
      {widgets.map((w) => (
        <div key={w.id} className="overflow-hidden">
          {renderWidget(w, editMode)}
        </div>
      ))}
    </ResponsiveGrid>
  );
}
