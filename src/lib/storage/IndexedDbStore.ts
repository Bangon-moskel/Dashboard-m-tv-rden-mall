import Dexie, { type Table } from "dexie";
import type { ConfigStore } from "./ConfigStore";
import type { DashboardConfig } from "@/lib/types";

interface ConfigRow {
  id: string;
  data: DashboardConfig;
}

class DashboardDb extends Dexie {
  configs!: Table<ConfigRow, string>;
  constructor() {
    super("dashboard-mall");
    this.version(1).stores({ configs: "id" });
  }
}

export class IndexedDbStore implements ConfigStore {
  private db: DashboardDb;
  private key: string;

  constructor(key = "default") {
    this.db = new DashboardDb();
    this.key = key;
  }

  async load(): Promise<DashboardConfig | null> {
    const row = await this.db.configs.get(this.key);
    return row?.data ?? null;
  }

  async save(config: DashboardConfig): Promise<void> {
    await this.db.configs.put({ id: this.key, data: config });
  }

  async clear(): Promise<void> {
    await this.db.configs.delete(this.key);
  }
}
