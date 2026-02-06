import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { EnvironmentSummary } from "./environment-summary";
import { CurrentVersionsTable } from "./current-versions-table";
import { QuickActions } from "./quick-actions";
import { AddPluginDialog } from "@/features/plugins/add-plugin-dialog";
import { useAppStore } from "@/stores/app-store";
import { useAddPlugin } from "@/hooks/use-add-plugin";
import * as commands from "@/lib/commands";
import type { CurrentVersion, AsdfInfo } from "@/lib/types";

export function DashboardPage() {
  const { t } = useTranslation();
  const { asdfVersion, pluginCount, refreshStatus } = useAppStore();

  const [info, setInfo] = useState<AsdfInfo | null>(null);
  const [versions, setVersions] = useState<CurrentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [installingKey, setInstallingKey] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [infoResult, versionsResult] = await Promise.all([
        commands.asdfInfo().catch(() => null),
        commands.currentVersions().catch(() => [] as CurrentVersion[]),
      ]);
      setInfo(infoResult);
      setVersions(versionsResult);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const {
    showAddPlugin,
    setShowAddPlugin,
    registry,
    registryLoading,
    openAddPlugin,
    addPlugin,
  } = useAddPlugin({
    onSuccess: async (name) => {
      toast.success(t("plugins.pluginAdded", { name }));
      await refreshStatus();
      await loadData();
    },
  });

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await refreshStatus();
      await loadData();
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleInstall(name: string, version: string) {
    const key = `${name}@${version}`;
    setInstallingKey(key);
    try {
      await commands.installVersion(name, version, false, null, () => {});
      toast.success(t("versions.versionInstalled", { name, version }));
      await loadData();
      await refreshStatus();
    } catch (e) {
      toast.error(t("errors.commandFailed", { message: String(e) }));
    } finally {
      setInstallingKey(null);
    }
  }

  async function handleInstallAll() {
    const uninstalled = versions.filter((v) => !v.installed);
    for (const v of uninstalled) {
      await handleInstall(v.name, v.version);
    }
  }

  const hasUninstalled = versions.some((v) => !v.installed);
  const totalVersions = info?.plugins.length ?? pluginCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
        <QuickActions
          onInstallAll={handleInstallAll}
          onAddPlugin={openAddPlugin}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          hasUninstalled={hasUninstalled}
        />
      </div>

      <EnvironmentSummary
        asdfVersion={asdfVersion}
        dataDir={info?.asdf_data_dir ?? ""}
        pluginCount={pluginCount}
        totalVersions={totalVersions}
      />

      <CurrentVersionsTable
        versions={versions}
        isLoading={isLoading}
        onInstall={handleInstall}
        installingKey={installingKey}
      />

      <AddPluginDialog
        open={showAddPlugin}
        onOpenChange={setShowAddPlugin}
        registry={registry}
        registryLoading={registryLoading}
        onAdd={addPlugin}
      />
    </div>
  );
}
