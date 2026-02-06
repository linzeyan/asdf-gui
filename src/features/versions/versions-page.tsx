import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstalledVersions } from "./installed-versions";
import { AvailableVersions } from "./available-versions";
import { InstallProgress } from "./install-progress";
import { LatestVersions } from "./latest-versions";
import { useVersionActions } from "./use-version-actions";
import { useAppStore } from "@/stores/app-store";
import * as commands from "@/lib/commands";
import type { Plugin, LatestInfo } from "@/lib/types";

export function VersionsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const refreshStatus = useAppStore((s) => s.refreshStatus);

  // Plugin list
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<string>(
    searchParams.get("plugin") ?? "",
  );

  // Per-plugin data
  const [installed, setInstalled] = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>([]);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [installedLoading, setInstalledLoading] = useState(false);
  const [availableLoading, setAvailableLoading] = useState(false);

  // Install progress
  const [installTarget, setInstallTarget] = useState<{
    plugin: string;
    version: string;
  } | null>(null);
  const [installLines, setInstallLines] = useState<string[]>([]);
  const [isInstalling, setIsInstalling] = useState(false);

  // Latest versions (cross-plugin overview)
  const [latestData, setLatestData] = useState<LatestInfo[]>([]);
  const [latestLoading, setLatestLoading] = useState(true);
  const [latestInstallingKey, setLatestInstallingKey] = useState<string | null>(
    null,
  );

  // Load plugin list
  useEffect(() => {
    commands
      .pluginList(false, false)
      .then(setPlugins)
      .catch(() => setPlugins([]));
  }, []);

  // Load latest overview
  useEffect(() => {
    setLatestLoading(true);
    commands
      .latestAll()
      .then(setLatestData)
      .catch(() => setLatestData([]))
      .finally(() => setLatestLoading(false));
  }, []);

  // Load per-plugin data when selection changes
  const loadPluginData = useCallback(async (name: string) => {
    if (!name) return;
    setInstalledLoading(true);
    setAvailableLoading(true);

    const [installedResult, currentResult, latestResult] = await Promise.all([
      commands.listInstalled(name).catch(() => [] as string[]),
      commands
        .currentVersions(name)
        .then((vs) => (vs.length > 0 ? vs[0].version : null))
        .catch(() => null),
      commands.latestVersion(name).catch(() => null),
    ]);

    setInstalled(installedResult);
    setCurrentVersion(currentResult);
    setLatestVersion(latestResult);
    setInstalledLoading(false);

    // Load available separately — can be slow
    commands
      .listAll(name)
      .then(setAvailable)
      .catch(() => setAvailable([]))
      .finally(() => setAvailableLoading(false));
  }, []);

  useEffect(() => {
    loadPluginData(selectedPlugin);
  }, [selectedPlugin, loadPluginData]);

  // Version action handlers (set local/global, uninstall, show path)
  const { actionKey, handleSetVersion, handleUninstall, handleShowPath } =
    useVersionActions(selectedPlugin, loadPluginData);

  function handleSelectPlugin(name: string) {
    setSelectedPlugin(name);
    setSearchParams({ plugin: name });
    setInstallTarget(null);
  }

  function handleInstall(version: string) {
    setInstallTarget({ plugin: selectedPlugin, version });
    setInstallLines([]);
    setIsInstalling(true);

    commands
      .installVersion(selectedPlugin, version, false, null, (event) => {
        if ("Stdout" in event) {
          setInstallLines((prev) => [...prev, event.Stdout]);
        } else if ("Stderr" in event) {
          setInstallLines((prev) => [...prev, event.Stderr]);
        } else if ("Finished" in event) {
          setIsInstalling(false);
          if (event.Finished.success) {
            toast.success(
              t("versions.versionInstalled", { name: selectedPlugin, version }),
            );
            loadPluginData(selectedPlugin);
            refreshStatus();
            // Refresh latest overview
            commands
              .latestAll()
              .then(setLatestData)
              .catch(() => {});
          } else {
            toast.error(
              t("versions.installFailed", { name: selectedPlugin, version }),
            );
          }
        }
      })
      .catch((e) => {
        setIsInstalling(false);
        setInstallLines((prev) => [...prev, `Error: ${String(e)}`]);
        toast.error(String(e));
      });
  }

  async function handleInstallLatest(name: string, version: string) {
    const key = `${name}@${version}`;
    setLatestInstallingKey(key);
    try {
      await commands.installVersion(name, version, false, null, () => {});
      toast.success(t("versions.versionInstalled", { name, version }));
      // Refresh latest data
      const updated = await commands.latestAll().catch(() => []);
      setLatestData(updated);
      if (name === selectedPlugin) {
        await loadPluginData(selectedPlugin);
      }
      await refreshStatus();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLatestInstallingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("versions.title")}</h1>
        <Select value={selectedPlugin} onValueChange={handleSelectPlugin}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t("versions.selectPlugin")} />
          </SelectTrigger>
          <SelectContent>
            {plugins.map((p) => (
              <SelectItem key={p.name} value={p.name}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="plugin">
        <TabsList>
          <TabsTrigger value="plugin">
            {selectedPlugin || t("versions.selectPlugin")}
          </TabsTrigger>
          <TabsTrigger value="latest">
            {t("versions.latestVersions")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plugin" className="space-y-6">
          {!selectedPlugin ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {t("versions.selectPlugin")}
            </p>
          ) : (
            <>
              {installTarget && (
                <InstallProgress
                  plugin={installTarget.plugin}
                  version={installTarget.version}
                  lines={installLines}
                  isRunning={isInstalling}
                  onClose={() => setInstallTarget(null)}
                />
              )}

              <InstalledVersions
                plugin={selectedPlugin}
                versions={installed}
                currentVersion={currentVersion}
                isLoading={installedLoading}
                onSetLocal={(v) => handleSetVersion(v, "Local")}
                onSetGlobal={(v) => handleSetVersion(v, "Home")}
                onUninstall={handleUninstall}
                onShowPath={handleShowPath}
                actionKey={actionKey}
              />

              <AvailableVersions
                versions={available}
                installedVersions={installed}
                latestVersion={latestVersion}
                isLoading={availableLoading}
                installingVersion={
                  installTarget && isInstalling ? installTarget.version : null
                }
                onInstall={handleInstall}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="latest">
          <LatestVersions
            data={latestData}
            isLoading={latestLoading}
            onInstallLatest={handleInstallLatest}
            installingKey={latestInstallingKey}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
