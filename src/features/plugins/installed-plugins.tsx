import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Trash2, RefreshCw, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Plugin } from "@/lib/types";

interface InstalledPluginsProps {
  plugins: Plugin[];
  isLoading: boolean;
  onRemove: (name: string) => void;
  onUpdate: (name: string) => void;
  onViewVersions: (name: string) => void;
  removingKey: string | null;
  updatingKey: string | null;
}

export function InstalledPlugins({
  plugins,
  isLoading,
  onRemove,
  onUpdate,
  onViewVersions,
  removingKey,
  updatingKey,
}: InstalledPluginsProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const filtered = plugins.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <>
      <Card className="border-border/50 bg-card rounded-xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">
            {t("plugins.installed")}
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
                  <TableHead className="pl-6">Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="pl-6 font-medium">{p.name}</TableCell>
                    <TableCell
                      className="text-muted-foreground max-w-[300px] truncate font-mono text-xs"
                      title={p.url ?? ""}
                    >
                      {p.url ?? "—"}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => onViewVersions(p.name)}
                        >
                          <Eye className="mr-1 size-3" />
                          {t("plugins.viewVersions")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          disabled={updatingKey === p.name}
                          onClick={() => onUpdate(p.name)}
                        >
                          {updatingKey === p.name ? (
                            <Loader2 className="mr-1 size-3 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-1 size-3" />
                          )}
                          {t("common.update")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-7 px-2 text-xs"
                          disabled={removingKey === p.name}
                          onClick={() => setConfirmRemove(p.name)}
                        >
                          {removingKey === p.name ? (
                            <Loader2 className="mr-1 size-3 animate-spin" />
                          ) : (
                            <Trash2 className="mr-1 size-3" />
                          )}
                          {t("common.remove")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={confirmRemove !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmRemove(null);
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("common.confirm")}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            {t("plugins.removeConfirm", { name: confirmRemove })}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmRemove) onRemove(confirmRemove);
                setConfirmRemove(null);
              }}
            >
              {t("common.remove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
