import { create } from "zustand";
import type { AppConfig } from "@/lib/types";
import * as commands from "@/lib/commands";

interface SettingsState {
  config: AppConfig | null;
  isLoading: boolean;

  loadSettings: () => Promise<void>;
  updateSettings: (patch: Partial<AppConfig>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  config: null,
  isLoading: true,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const config = await commands.readConfig();
      set({ config, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  updateSettings: async (patch) => {
    const current = get().config;
    if (!current) return;
    const updated = { ...current, ...patch };
    await commands.writeConfig(updated);
    set({ config: updated });
  },
}));
