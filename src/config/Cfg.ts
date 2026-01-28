import type { StackManagerConfig } from "../stack/stackManager";
import { StackManager } from "../stack/stackManager";
import { BackManager } from "../lib/backManager";
import type { LayerManagerConfig } from "../lib/layerManager";
import { LayerManager } from "../lib/layerManager";

export type AppConfig = {
  stack: StackManagerConfig;
  layer?: LayerManagerConfig;
};

export class ConfigManager {
  private config: AppConfig | null = null;
  private stackManager: StackManager | null = null;
  private layerManager: LayerManager | null = null;
  private backManager: BackManager | null = null;

  init(config: AppConfig) {
    this.config = config;
    this.layerManager = new LayerManager(config.layer ?? {});
    this.stackManager = new StackManager(config.stack);
    this.backManager = new BackManager({
      layerManager: this.layerManager,
      stackManager: this.stackManager,
    });
  }

  isInitialized() {
    return Boolean(this.stackManager && this.layerManager && this.backManager);
  }

  getConfig() {
    return this.config;
  }

  getStack() {
    if (!this.stackManager) {
      throw new Error("Cfg is not initialized: call Cfg.init(config) first.");
    }
    return this.stackManager;
  }

  getLayer() {
    if (!this.layerManager) {
      throw new Error("Cfg is not initialized: call Cfg.init(config) first.");
    }
    return this.layerManager;
  }

  getBack() {
    if (!this.backManager) {
      throw new Error("Cfg is not initialized: call Cfg.init(config) first.");
    }
    return this.backManager;
  }
}

const GLOBAL_CFG_KEY = "__STACKFLOW_CFG__";
const globalCfg = globalThis as typeof globalThis & {
  [GLOBAL_CFG_KEY]?: ConfigManager;
  Cfg?: ConfigManager;
};

export const Cfg =
  globalCfg[GLOBAL_CFG_KEY] ?? (globalCfg[GLOBAL_CFG_KEY] = new ConfigManager());

declare global {
  // Optional global access for debugging and the referenced project structure.
  var Cfg: ConfigManager | undefined;
  var __STACKFLOW_CFG__: ConfigManager | undefined;
}

globalCfg.Cfg = Cfg;
globalCfg[GLOBAL_CFG_KEY] = Cfg;
