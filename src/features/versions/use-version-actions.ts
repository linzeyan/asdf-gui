import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";
import * as commands from "@/lib/commands";

export function useVersionActions(
  selectedPlugin: string,
  loadPluginData: (name: string) => Promise<void>,
) {
  const { t } = useTranslation();
  const [actionKey, setActionKey] = useState<string | null>(null);
  const refreshStatus = useAppStore((s) => s.refreshStatus);

  async function handleSetVersion(version: string, scope: "Local" | "Home") {
    const label = scope === "Local" ? "local" : "global";
    setActionKey(`${label}:${version}`);
    try {
      await commands.setVersion(selectedPlugin, [version], scope);
      toast.success(
        t("versions.versionSet", {
          name: selectedPlugin,
          version,
          scope: label,
        }),
      );
      await loadPluginData(selectedPlugin);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setActionKey(null);
    }
  }

  async function handleUninstall(version: string) {
    setActionKey(`uninstall:${version}`);
    try {
      await commands.uninstallVersion(selectedPlugin, version);
      toast.success(
        t("versions.versionUninstalled", { name: selectedPlugin, version }),
      );
      await loadPluginData(selectedPlugin);
      await refreshStatus();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setActionKey(null);
    }
  }

  async function handleShowPath(version: string) {
    try {
      const path = await commands.whereInstalled(selectedPlugin, version);
      toast.info(path);
    } catch (e) {
      toast.error(String(e));
    }
  }

  return { actionKey, handleSetVersion, handleUninstall, handleShowPath };
}
