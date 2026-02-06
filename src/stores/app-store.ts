import { create } from "zustand";
import * as commands from "@/lib/commands";

interface AppState {
  workingDir: string | null;
  asdfVersion: string | null;
  pluginCount: number;
  isAsdfAvailable: boolean;
  isLoading: boolean;
  error: string | null;

  setWorkingDir: (dir: string) => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  workingDir: null,
  asdfVersion: null,
  pluginCount: 0,
  isAsdfAvailable: false,
  isLoading: true,
  error: null,

  setWorkingDir: async (dir) => {
    try {
      const config = await commands.setWorkingDirectory(dir);
      set({ workingDir: config.working_directory });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  refreshStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const version = await commands.asdfVersion();
      const plugins = await commands.pluginList(false, false);
      set({
        asdfVersion: version,
        pluginCount: plugins.length,
        isAsdfAvailable: true,
        isLoading: false,
      });
    } catch (e) {
      set({
        isAsdfAvailable: false,
        isLoading: false,
        error: String(e),
      });
    }
  },
}));
