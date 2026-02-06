import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, MapPin, Globe, Trash2, FolderOpen } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface InstalledVersionsProps {
  plugin: string;
  versions: string[];
  currentVersion: string | null;
  isLoading: boolean;
  onSetLocal: (version: string) => void;
  onSetGlobal: (version: string) => void;
  onUninstall: (version: string) => void;
  onShowPath: (version: string) => void;
  actionKey: string | null;
}

export function InstalledVersions({
  plugin,
  versions,
  currentVersion,
  isLoading,
  onSetLocal,
  onSetGlobal,
  onUninstall,
  onShowPath,
  actionKey,
}: InstalledVersionsProps) {
  const { t } = useTranslation();
  const [confirmUninstall, setConfirmUninstall] = useState<string | null>(null);

  return (
    <>
      <Card className="border-border/50 bg-card rounded-xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            {t("versions.installed")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
            </div>
          ) : versions.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No versions installed for {plugin}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((v) => {
                  const isCurrent = v === currentVersion;
                  return (
                    <TableRow key={v}>
                      <TableCell className="pl-6 font-mono text-sm">
                        {v}
                      </TableCell>
                      <TableCell>
                        {isCurrent && (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          >
                            {t("versions.current")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            disabled={actionKey !== null}
                            onClick={() => onSetLocal(v)}
                          >
                            <MapPin className="mr-1 size-3" />
                            {t("versions.setLocal")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            disabled={actionKey !== null}
                            onClick={() => onSetGlobal(v)}
                          >
                            <Globe className="mr-1 size-3" />
                            {t("versions.setGlobal")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            disabled={actionKey !== null}
                            onClick={() => onShowPath(v)}
                          >
                            <FolderOpen className="mr-1 size-3" />
                            {t("versions.showPath")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive h-7 px-2 text-xs"
                            disabled={actionKey !== null}
                            onClick={() => setConfirmUninstall(v)}
                          >
                            {actionKey === `uninstall:${v}` ? (
                              <Loader2 className="mr-1 size-3 animate-spin" />
                            ) : (
                              <Trash2 className="mr-1 size-3" />
                            )}
                            {t("common.uninstall")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={confirmUninstall !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmUninstall(null);
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("common.confirm")}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Uninstall {plugin} {confirmUninstall}?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUninstall(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmUninstall) onUninstall(confirmUninstall);
                setConfirmUninstall(null);
              }}
            >
              {t("common.uninstall")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
