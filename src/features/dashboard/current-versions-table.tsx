import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Loader2 } from "lucide-react";
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
import type { CurrentVersion } from "@/lib/types";

interface CurrentVersionsTableProps {
  versions: CurrentVersion[];
  isLoading: boolean;
  onInstall: (name: string, version: string) => void;
  installingKey: string | null;
}

export function CurrentVersionsTable({
  versions,
  isLoading,
  onInstall,
  installingKey,
}: CurrentVersionsTableProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("");

  const filtered = versions.filter((v) =>
    v.name.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <Card className="border-border/50 bg-card rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">
          {t("dashboard.currentVersions")}
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
            {t("dashboard.noPlugins")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Tool</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="pr-6 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => {
                const key = `${v.name}@${v.version}`;
                return (
                  <TableRow key={v.name}>
                    <TableCell className="pl-6 font-medium">{v.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {v.version}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground max-w-[200px] truncate"
                      title={v.source}
                    >
                      {v.source}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {v.installed ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        >
                          {v.version}
                        </Badge>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          >
                            <AlertCircle className="mr-1 size-3" />
                            {t("common.notInstalled")}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs"
                            disabled={installingKey === key}
                            onClick={() => onInstall(v.name, v.version)}
                          >
                            {installingKey === key ? (
                              <Loader2 className="mr-1 size-3 animate-spin" />
                            ) : null}
                            {t("common.install")}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
