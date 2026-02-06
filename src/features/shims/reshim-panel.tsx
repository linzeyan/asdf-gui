import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as commands from "@/lib/commands";
import type { Plugin } from "@/lib/types";

export function ReshimPanel() {
  const { t } = useTranslation();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState("");
  const [versions, setVersions] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    commands
      .pluginList(false, false)
      .then(setPlugins)
      .catch(() => setPlugins([]));
  }, []);

  useEffect(() => {
    if (!selectedPlugin) {
      setVersions([]);
      setSelectedVersion("");
      return;
    }
    commands
      .listInstalled(selectedPlugin)
      .then((v) => {
        setVersions(v);
        setSelectedVersion(v.length > 0 ? v[v.length - 1] : "");
      })
      .catch(() => setVersions([]));
  }, [selectedPlugin]);

  async function handleReshim() {
    if (!selectedPlugin || !selectedVersion) return;
    setIsLoading(true);
    try {
      await commands.reshim(selectedPlugin, selectedVersion);
      toast.success(`Reshimmed ${selectedPlugin}@${selectedVersion}`);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-border/50 bg-card rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          {t("shims.reshim")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-sm font-medium">
              {t("shims.selectPlugin")}
            </label>
            <Select value={selectedPlugin} onValueChange={setSelectedPlugin}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("shims.selectPlugin")} />
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

          <div className="space-y-1.5">
            <label className="text-muted-foreground text-sm font-medium">
              {t("shims.selectVersion")}
            </label>
            <Select value={selectedVersion} onValueChange={setSelectedVersion}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("shims.selectVersion")} />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleReshim}
            disabled={!selectedPlugin || !selectedVersion || isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 size-4" />
            )}
            {t("shims.reshim")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
