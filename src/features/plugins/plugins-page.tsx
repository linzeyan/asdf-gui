import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Loader2, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InstalledPlugins } from "./installed-plugins";
import { AddPluginDialog } from "./add-plugin-dialog";
import { useAppStore } from "@/stores/app-store";
import * as commands from "@/lib/commands";
import type { Plugin, PluginRegistry } from "@/lib/types";

export function PluginsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const refreshStatus = useAppStore((s) => s.refreshStatus);

  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [updatingAll, setUpdatingAll] = useState(false);

  // Add Plugin dialog
  const [showAddPlugin, setShowAddPlugin] = useState(false);
  const [registry, setRegistry] = useState<PluginRegistry[]>([]);
  const [registryLoading, setRegistryLoading] = useState(false);

  const loadPlugins = useCallback(async () => {
    try {
      const list = await commands.pluginList(true, true);
      setPlugins(list);
    } catch {
      setPlugins([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlugins();
  }, [loadPlugins]);

  async function handleRemove(name: string) {
    setRemovingKey(name);
    try {
      await commands.pluginRemove(name);
      toast.success(`Plugin "${name}" removed`);
      await loadPlugins();
      await refreshStatus();
    } catch (e) {
      toast.error(t("errors.commandFailed", { message: String(e) }));
    } finally {
      setRemovingKey(null);
    }
  }

  async function handleUpdate(name: string) {
    setUpdatingKey(name);
    try {
      await commands.pluginUpdate(name);
      toast.success(`Plugin "${name}" updated`);
      await loadPlugins();
    } catch (e) {
      toast.error(t("errors.commandFailed", { message: String(e) }));
    } finally {
      setUpdatingKey(null);
    }
  }

  async function handleUpdateAll() {
    setUpdatingAll(true);
    try {
      await commands.pluginUpdate(undefined, true);
      toast.success("All plugins updated");
      await loadPlugins();
    } catch (e) {
      toast.error(t("errors.commandFailed", { message: String(e) }));
    } finally {
      setUpdatingAll(false);
    }
  }

  function handleViewVersions(name: string) {
    navigate(`/versions?plugin=${encodeURIComponent(name)}`);
  }

  async function handleOpenAddPlugin() {
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

  async function handleAddPlugin(name: string, gitUrl?: string) {
    await commands.pluginAdd(name, gitUrl);
    toast.success(`Plugin "${name}" added`);
    await loadPlugins();
    await refreshStatus();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("plugins.title")}</h1>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={updatingAll || plugins.length === 0}
            onClick={handleUpdateAll}
          >
            {updatingAll ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 size-3.5" />
            )}
            {t("plugins.updateAll")}
          </Button>
          <Button size="sm" onClick={handleOpenAddPlugin}>
            <Plus className="mr-1.5 size-3.5" />
            {t("plugins.addPlugin")}
          </Button>
        </div>
      </div>

      <InstalledPlugins
        plugins={plugins}
        isLoading={isLoading}
        onRemove={handleRemove}
        onUpdate={handleUpdate}
        onViewVersions={handleViewVersions}
        removingKey={removingKey}
        updatingKey={updatingKey}
      />

      <AddPluginDialog
        open={showAddPlugin}
        onOpenChange={setShowAddPlugin}
        registry={registry}
        registryLoading={registryLoading}
        onAdd={handleAddPlugin}
      />
    </div>
  );
}
