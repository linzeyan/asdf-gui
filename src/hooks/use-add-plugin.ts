import { useState } from "react";
import * as commands from "@/lib/commands";
import type { PluginRegistry } from "@/lib/types";

export interface UseAddPluginOptions {
  onSuccess?: (name: string) => void | Promise<void>;
}

export function useAddPlugin(options?: UseAddPluginOptions) {
  const [showAddPlugin, setShowAddPlugin] = useState(false);
  const [registry, setRegistry] = useState<PluginRegistry[]>([]);
  const [registryLoading, setRegistryLoading] = useState(false);

  async function openAddPlugin() {
    setShowAddPlugin(true);
    if (registry.length === 0) {
      setRegistryLoading(true);
      try {
        const all = await commands.pluginListAll();
        setRegistry(all);
      } catch {
        // registry will be empty
      } finally {
        setRegistryLoading(false);
      }
    }
  }

  async function addPlugin(name: string, gitUrl?: string) {
    await commands.pluginAdd(name, gitUrl);
    await options?.onSuccess?.(name);
  }

  return {
    showAddPlugin,
    setShowAddPlugin,
    registry,
    registryLoading,
    openAddPlugin,
    addPlugin,
  };
}
