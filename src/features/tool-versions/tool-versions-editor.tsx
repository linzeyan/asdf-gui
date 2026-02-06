import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, AlertCircle, Download, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ToolVersion, Plugin } from "@/lib/types";

interface ToolVersionsEditorProps {
  entries: ToolVersion[];
  plugins: Plugin[];
  installedPlugins: Set<string>;
  installedVersionsMap: Map<string, Set<string>>;
  isLoading: boolean;
  filePath: string | null;
  onChange: (entries: ToolVersion[]) => void;
  onInstallVersion: (plugin: string, version: string) => void;
  installingKey: string | null;
}

export function ToolVersionsEditor({
  entries,
  plugins,
  installedPlugins,
  installedVersionsMap,
  isLoading,
  filePath,
  onChange,
  onInstallVersion,
  installingKey,
}: ToolVersionsEditorProps) {
  const { t } = useTranslation();
  const [newTool, setNewTool] = useState("");
  const [newVersion, setNewVersion] = useState("");

  function handleAddRow() {
    if (!newTool.trim() || !newVersion.trim()) return;
    const updated = [
      ...entries,
      { tool: newTool.trim(), versions: [newVersion.trim()] },
    ];
    onChange(updated);
    setNewTool("");
    setNewVersion("");
  }

  function handleRemoveRow(index: number) {
    const updated = entries.filter((_, i) => i !== index);
    onChange(updated);
  }

  function handleUpdateTool(index: number, value: string) {
    const updated = entries.map((e, i) =>
      i === index ? { ...e, tool: value } : e,
    );
    onChange(updated);
  }

  function handleUpdateVersion(index: number, value: string) {
    const updated = entries.map((e, i) =>
      i === index ? { ...e, versions: [value] } : e,
    );
    onChange(updated);
  }

  function getValidation(entry: ToolVersion) {
    const warnings: string[] = [];
    if (!installedPlugins.has(entry.tool)) {
      warnings.push(t("toolVersions.validation.pluginNotInstalled"));
    } else {
      const versions = installedVersionsMap.get(entry.tool);
      for (const v of entry.versions) {
        if (versions && !versions.has(v)) {
          warnings.push(t("toolVersions.validation.versionNotInstalled"));
        }
      }
    }
    return warnings;
  }

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card rounded-xl shadow-sm">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold">
            {t("toolVersions.title")}
          </CardTitle>
          {filePath && (
            <p
              className="text-muted-foreground mt-1 max-w-[400px] truncate text-xs"
              title={filePath}
            >
              {filePath}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {entries.length === 0 && !newTool ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            {t("toolVersions.fileNotFound")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Tool</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, index) => {
                const warnings = getValidation(entry);
                const versionStr = entry.versions.join(" ");
                return (
                  <TableRow key={index}>
                    <TableCell className="pl-6">
                      <Input
                        className="h-8 w-32 font-medium"
                        value={entry.tool}
                        onChange={(e) =>
                          handleUpdateTool(index, e.target.value)
                        }
                        list="plugin-list"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 w-40 font-mono text-sm"
                        value={versionStr}
                        onChange={(e) =>
                          handleUpdateVersion(index, e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {warnings.length > 0 ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                >
                                  <AlertCircle className="mr-1 size-3" />
                                  {warnings[0]}
                                </Badge>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {warnings.join(", ")}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        >
                          OK
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {warnings.some((w) => w.includes("Version")) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            disabled={
                              installingKey ===
                              `${entry.tool}@${entry.versions[0]}`
                            }
                            onClick={() =>
                              onInstallVersion(entry.tool, entry.versions[0])
                            }
                          >
                            {installingKey ===
                            `${entry.tool}@${entry.versions[0]}` ? (
                              <Loader2 className="mr-1 size-3 animate-spin" />
                            ) : (
                              <Download className="mr-1 size-3" />
                            )}
                            {t("common.install")}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-7 px-2 text-xs"
                          onClick={() => handleRemoveRow(index)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* New row */}
              <TableRow>
                <TableCell className="pl-6">
                  <Input
                    className="h-8 w-32"
                    placeholder="plugin"
                    value={newTool}
                    onChange={(e) => setNewTool(e.target.value)}
                    list="plugin-list"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="h-8 w-40 font-mono text-sm"
                    placeholder="version"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddRow();
                    }}
                  />
                </TableCell>
                <TableCell />
                <TableCell className="pr-6 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={!newTool.trim() || !newVersion.trim()}
                    onClick={handleAddRow}
                  >
                    <Plus className="mr-1 size-3" />
                    {t("toolVersions.addRow")}
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}

        {/* Datalist for plugin autocomplete */}
        <datalist id="plugin-list">
          {plugins.map((p) => (
            <option key={p.name} value={p.name} />
          ))}
        </datalist>
      </CardContent>
    </Card>
  );
}
