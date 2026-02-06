import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolVersionsEditor } from "./tool-versions-editor";
import * as commands from "@/lib/commands";
import type { ToolVersion, Plugin, SetScope } from "@/lib/types";

export function ToolVersionsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"Local" | "Home" | "custom">("Local");
  const [customPath, setCustomPath] = useState("");

  const [entries, setEntries] = useState<ToolVersion[]>([]);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Plugin/version validation data
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [installedPlugins, setInstalledPlugins] = useState<Set<string>>(
    new Set(),
  );
  const [installedVersionsMap, setInstalledVersionsMap] = useState<
    Map<string, Set<string>>
  >(new Map());
  const [installingKey, setInstallingKey] = useState<string | null>(null);

  // Load plugin list for validation
  useEffect(() => {
    commands
      .pluginList(false, false)
      .then((list) => {
        setPlugins(list);
        setInstalledPlugins(new Set(list.map((p) => p.name)));
        // Load installed versions for each plugin
        Promise.all(
          list.map(async (p) => {
            const versions = await commands
              .listInstalled(p.name)
              .catch(() => [] as string[]);
            return [p.name, new Set(versions)] as const;
          }),
        ).then((results) => {
          setInstalledVersionsMap(new Map(results));
        });
      })
      .catch(() => {});
  }, []);

  const loadFile = useCallback(
    async (scope: SetScope | null, path?: string) => {
      setIsLoading(true);
      setIsDirty(false);
      try {
        let resolvedPath: string;
        if (scope) {
          resolvedPath = await commands.getToolVersionsPath(scope);
        } else if (path) {
          resolvedPath = path;
        } else {
          setIsLoading(false);
          return;
        }
        setFilePath(resolvedPath);
        const data = await commands
          .readToolVersions(resolvedPath)
          .catch(() => [] as ToolVersion[]);
        setEntries(data);
      } catch {
        setFilePath(null);
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Load on tab change
  useEffect(() => {
    if (tab === "Local") loadFile("Local");
    else if (tab === "Home") loadFile("Home");
  }, [tab, loadFile]);

  function handleLoadCustom() {
    if (customPath.trim()) {
      loadFile(null, customPath.trim());
    }
  }

  function handleChange(updated: ToolVersion[]) {
    setEntries(updated);
    setIsDirty(true);
  }

  async function handleSave() {
    if (!filePath) return;
    setIsSaving(true);
    try {
      await commands.writeToolVersions(filePath, entries);
      toast.success(`Saved ${filePath}`);
      setIsDirty(false);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleInstallVersion(plugin: string, version: string) {
    const key = `${plugin}@${version}`;
    setInstallingKey(key);
    try {
      await commands.installVersion(plugin, version, false, null, () => {});
      toast.success(`${plugin}@${version} installed`);
      // Refresh installed versions
      const versions = await commands
        .listInstalled(plugin)
        .catch(() => [] as string[]);
      setInstalledVersionsMap((prev) => {
        const next = new Map(prev);
        next.set(plugin, new Set(versions));
        return next;
      });
    } catch (e) {
      toast.error(String(e));
    } finally {
      setInstallingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("toolVersions.title")}</h1>
        {isDirty && (
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 size-3.5" />
            )}
            {t("common.save")}
          </Button>
        )}
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "Local" | "Home" | "custom")}
      >
        <TabsList>
          <TabsTrigger value="Local">{t("toolVersions.local")}</TabsTrigger>
          <TabsTrigger value="Home">{t("toolVersions.global")}</TabsTrigger>
          <TabsTrigger value="custom">{t("toolVersions.custom")}</TabsTrigger>
        </TabsList>

        <TabsContent value="Local">
          <ToolVersionsEditor
            entries={entries}
            plugins={plugins}
            installedPlugins={installedPlugins}
            installedVersionsMap={installedVersionsMap}
            isLoading={isLoading}
            filePath={filePath}
            onChange={handleChange}
            onInstallVersion={handleInstallVersion}
            installingKey={installingKey}
          />
        </TabsContent>

        <TabsContent value="Home">
          <ToolVersionsEditor
            entries={entries}
            plugins={plugins}
            installedPlugins={installedPlugins}
            installedVersionsMap={installedVersionsMap}
            isLoading={isLoading}
            filePath={filePath}
            onChange={handleChange}
            onInstallVersion={handleInstallVersion}
            installingKey={installingKey}
          />
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="/path/to/.tool-versions"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLoadCustom();
              }}
            />
            <Button
              variant="outline"
              onClick={handleLoadCustom}
              disabled={!customPath.trim()}
            >
              Load
            </Button>
          </div>
          <ToolVersionsEditor
            entries={entries}
            plugins={plugins}
            installedPlugins={installedPlugins}
            installedVersionsMap={installedVersionsMap}
            isLoading={isLoading}
            filePath={filePath}
            onChange={handleChange}
            onInstallVersion={handleInstallVersion}
            installingKey={installingKey}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
