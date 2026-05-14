import type { DashboardConfig } from "@/lib/types";

export interface ConfigStore {
  load(): Promise<DashboardConfig | null>;
  save(config: DashboardConfig): Promise<void>;
  clear(): Promise<void>;
}
