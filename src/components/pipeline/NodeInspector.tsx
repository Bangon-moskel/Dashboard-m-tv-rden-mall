"use client";

import { useDashboard } from "@/lib/store";
import type {
  ExprConfig,
  HttpConfig,
  JsonPathConfig,
  OutputConfig,
  PipelineNode,
  ScheduleConfig,
  StaticConfig,
} from "@/lib/types";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";

interface Props {
  pipelineId: string;
  node: PipelineNode | null;
}

export function NodeInspector({ pipelineId, node }: Props) {
  const updateNode = useDashboard((s) => s.updatePipelineNode);
  const removeNode = useDashboard((s) => s.removePipelineNode);

  if (!node) {
    return (
      <div className="p-4 text-sm text-muted">
        Markera en nod för att se inställningar.
      </div>
    );
  }

  const update = (patch: Partial<PipelineNode>) =>
    updateNode(pipelineId, node.id, patch);
  const updateConfig = (config: PipelineNode["config"]) => update({ config });

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs text-muted uppercase tracking-wider">
            {node.kind}
          </div>
          <input
            value={node.label}
            onChange={(e) => update({ label: e.target.value })}
            className="bg-transparent text-base font-semibold focus:outline-none focus:ring-1 focus:ring-accent/40 rounded px-1 -ml-1 w-full"
          />
        </div>
        {node.kind !== "schedule" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm("Ta bort noden?")) removeNode(pipelineId, node.id);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      {node.kind === "http" && (
        <HttpForm config={node.config as HttpConfig} onChange={updateConfig} />
      )}
      {node.kind === "schedule" && (
        <ScheduleForm
          config={node.config as ScheduleConfig}
          onChange={updateConfig}
        />
      )}
      {node.kind === "jsonpath" && (
        <JsonPathForm
          config={node.config as JsonPathConfig}
          onChange={updateConfig}
        />
      )}
      {node.kind === "expr" && (
        <ExprForm config={node.config as ExprConfig} onChange={updateConfig} />
      )}
      {node.kind === "static" && (
        <StaticForm
          config={node.config as StaticConfig}
          onChange={updateConfig}
        />
      )}
      {node.kind === "output" && (
        <OutputForm
          config={node.config as OutputConfig}
          onChange={updateConfig}
        />
      )}
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function HttpForm({ config, onChange }: { config: HttpConfig; onChange: (c: HttpConfig) => void }) {
  const headersText = Object.entries(config.headers || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  return (
    <>
      <Field label="URL">
        <Input
          value={config.url}
          onChange={(e) => onChange({ ...config, url: e.target.value })}
          placeholder="https://api.exempel.se/data"
        />
      </Field>
      <Field label="Method">
        <Select
          value={config.method}
          onChange={(e) =>
            onChange({ ...config, method: e.target.value as HttpConfig["method"] })
          }
        >
          {(["GET", "POST", "PUT", "PATCH", "DELETE"] as const).map((m) => (
            <option key={m}>{m}</option>
          ))}
        </Select>
      </Field>
      <Field label="Headers (en per rad, key: value)">
        <Textarea
          value={headersText}
          onChange={(e) => {
            const headers: Record<string, string> = {};
            for (const line of e.target.value.split("\n")) {
              const idx = line.indexOf(":");
              if (idx > 0) {
                const k = line.slice(0, idx).trim();
                const v = line.slice(idx + 1).trim();
                if (k) headers[k] = v;
              }
            }
            onChange({ ...config, headers });
          }}
          placeholder={"X-Api-Key: hemlig\nAccept: application/json"}
        />
      </Field>
      {config.method !== "GET" && (
        <Field label="Body (JSON)">
          <Textarea
            value={config.body ?? ""}
            onChange={(e) => onChange({ ...config, body: e.target.value })}
            placeholder="{}"
          />
        </Field>
      )}
      <Field label="Auth">
        <Select
          value={config.auth.kind}
          onChange={(e) => {
            const kind = e.target.value as "none" | "bearer" | "basic";
            if (kind === "none") onChange({ ...config, auth: { kind } });
            else if (kind === "bearer")
              onChange({ ...config, auth: { kind, token: "" } });
            else onChange({ ...config, auth: { kind, username: "", password: "" } });
          }}
        >
          <option value="none">Ingen</option>
          <option value="bearer">Bearer-token</option>
          <option value="basic">Basic auth</option>
        </Select>
      </Field>
      {config.auth.kind === "bearer" && (
        <Field label="Token">
          <Input
            value={config.auth.token}
            onChange={(e) =>
              onChange({ ...config, auth: { kind: "bearer", token: e.target.value } })
            }
          />
        </Field>
      )}
      {config.auth.kind === "basic" && (
        <>
          <Field label="Användarnamn">
            <Input
              value={config.auth.username}
              onChange={(e) => {
                const auth = config.auth.kind === "basic" ? config.auth : { kind: "basic" as const, username: "", password: "" };
                onChange({ ...config, auth: { ...auth, username: e.target.value } });
              }}
            />
          </Field>
          <Field label="Lösenord">
            <Input
              type="password"
              value={config.auth.password}
              onChange={(e) => {
                const auth = config.auth.kind === "basic" ? config.auth : { kind: "basic" as const, username: "", password: "" };
                onChange({ ...config, auth: { ...auth, password: e.target.value } });
              }}
            />
          </Field>
        </>
      )}
      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={config.useProxy}
          onChange={(e) => onChange({ ...config, useProxy: e.target.checked })}
        />
        Använd inbyggd CORS-proxy
      </label>
    </>
  );
}

function ScheduleForm({
  config,
  onChange,
}: {
  config: ScheduleConfig;
  onChange: (c: ScheduleConfig) => void;
}) {
  const presets = [5, 30, 60, 300, 900, 3600];
  return (
    <Field label="Intervall (sekunder)">
      <div className="flex gap-2">
        <Input
          type="number"
          min={1}
          value={config.intervalSeconds}
          onChange={(e) => onChange({ intervalSeconds: Math.max(1, Number(e.target.value)) })}
        />
      </div>
      <div className="flex flex-wrap gap-1 mt-1">
        {presets.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange({ intervalSeconds: s })}
            className="text-xs px-2 py-0.5 rounded border border-border hover:border-accent"
          >
            {formatSeconds(s)}
          </button>
        ))}
      </div>
    </Field>
  );
}

function JsonPathForm({
  config,
  onChange,
}: {
  config: JsonPathConfig;
  onChange: (c: JsonPathConfig) => void;
}) {
  return (
    <Field label="JSONPath-uttryck">
      <Input
        value={config.expression}
        onChange={(e) => onChange({ expression: e.target.value })}
        placeholder="$.data.value"
      />
      <p className="text-xs text-muted mt-1">
        Exempel: <code>$.users[*].name</code>, <code>$.data.total</code>
      </p>
    </Field>
  );
}

function ExprForm({
  config,
  onChange,
}: {
  config: ExprConfig;
  onChange: (c: ExprConfig) => void;
}) {
  return (
    <Field label="Uttryck">
      <Input
        value={config.expression}
        onChange={(e) => onChange({ expression: e.target.value })}
        placeholder="value * 100"
      />
      <p className="text-xs text-muted mt-1">
        Input finns som <code>value</code>. Objektfält är direkt åtkomliga.
      </p>
    </Field>
  );
}

function StaticForm({
  config,
  onChange,
}: {
  config: StaticConfig;
  onChange: (c: StaticConfig) => void;
}) {
  return (
    <Field label="JSON">
      <Textarea
        value={config.json}
        onChange={(e) => onChange({ json: e.target.value })}
      />
    </Field>
  );
}

function OutputForm({
  config,
  onChange,
}: {
  config: OutputConfig;
  onChange: (c: OutputConfig) => void;
}) {
  return (
    <Field label="Bind till">
      <Select
        value={config.bind}
        onChange={(e) => onChange({ bind: e.target.value as OutputConfig["bind"] })}
      >
        <option value="value">value (KPI / status)</option>
        <option value="series">series (graf)</option>
        <option value="rows">rows (tabell)</option>
        <option value="label">label (etikett)</option>
        <option value="status">status (badge)</option>
      </Select>
      <p className="text-xs text-muted mt-1">
        Widget läser detta fält från pipeline-resultatet.
      </p>
    </Field>
  );
}

function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${s / 60}m`;
  return `${s / 3600}h`;
}
