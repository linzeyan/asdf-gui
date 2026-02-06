import { useTranslation } from "react-i18next";
import { Loader2, ArrowUp } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LatestInfo } from "@/lib/types";

interface LatestVersionsProps {
  data: LatestInfo[];
  isLoading: boolean;
  onInstallLatest: (name: string, version: string) => void;
  installingKey: string | null;
}

export function LatestVersions({
  data,
  isLoading,
  onInstallLatest,
  installingKey,
}: LatestVersionsProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-border/50 bg-card rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          {t("versions.latestVersions")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No plugins installed
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Plugin</TableHead>
                <TableHead>Installed</TableHead>
                <TableHead>Latest</TableHead>
                <TableHead className="pr-6 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => {
                const key = `${item.name}@${item.latest}`;
                return (
                  <TableRow key={item.name}>
                    <TableCell className="pl-6 font-medium">
                      {item.name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.installed_version ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.latest}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {item.up_to_date ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        >
                          {t("common.upToDate")}
                        </Badge>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          >
                            <ArrowUp className="mr-1 size-3" />
                            {t("common.updateAvailable")}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs"
                            disabled={installingKey === key}
                            onClick={() =>
                              onInstallLatest(item.name, item.latest)
                            }
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
