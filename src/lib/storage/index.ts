import { IndexedDbStore } from "./IndexedDbStore";
import type { ConfigStore } from "./ConfigStore";

let instance: ConfigStore | null = null;

export function getStore(): ConfigStore {
  if (typeof window === "undefined") {
    throw new Error("ConfigStore is browser-only in Phase 1");
  }
  if (!instance) {
    instance = new IndexedDbStore();
  }
  return instance;
}

export type { ConfigStore } from "./ConfigStore";
