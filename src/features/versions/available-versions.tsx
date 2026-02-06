import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Download, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AvailableVersionsProps {
  versions: string[];
  installedVersions: string[];
  latestVersion: string | null;
  isLoading: boolean;
  installingVersion: string | null;
  onInstall: (version: string) => void;
}

export function AvailableVersions({
  versions,
  installedVersions,
  latestVersion,
  isLoading,
  installingVersion,
  onInstall,
}: AvailableVersionsProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const f = filter.toLowerCase();
    // Reverse to show newest first, then filter
    const reversed = [...versions].reverse();
    return f ? reversed.filter((v) => v.toLowerCase().includes(f)) : reversed;
  }, [versions, filter]);

  const installedSet = useMemo(
    () => new Set(installedVersions),
    [installedVersions],
  );

  return (
    <Card className="border-border/50 bg-card rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">
          {t("versions.available")}
          {versions.length > 0 && (
            <span className="text-muted-foreground ml-2 text-xs font-normal">
              ({versions.length})
            </span>
          )}
        </CardTitle>
        <Input
          className="h-8 w-48"
          placeholder={t("common.search")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No versions found
          </p>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-0.5 px-4 pb-4">
              {filtered.map((v) => {
                const isInstalled = installedSet.has(v);
                const isLatest = v === latestVersion;
                const isInstalling = installingVersion === v;
                return (
                  <div
                    key={v}
                    className="hover:bg-accent/50 flex items-center justify-between rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{v}</span>
                      {isLatest && (
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          <Star className="mr-1 size-3" />
                          Latest
                        </Badge>
                      )}
                      {isInstalled && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        >
                          Installed
                        </Badge>
                      )}
                    </div>
                    {!isInstalled && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs"
                        disabled={isInstalling}
                        onClick={() => onInstall(v)}
                      >
                        {isInstalling ? (
                          <Loader2 className="mr-1 size-3 animate-spin" />
                        ) : (
                          <Download className="mr-1 size-3" />
                        )}
                        {t("common.install")}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
