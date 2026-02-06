import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as commands from "@/lib/commands";
import type { ShimVersion } from "@/lib/types";

export function ShimLookup() {
  const { t } = useTranslation();
  const [command, setCommand] = useState("");
  const [resolvedPath, setResolvedPath] = useState<string | null>(null);
  const [versions, setVersions] = useState<ShimVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLookup() {
    if (!command.trim()) return;
    setIsLoading(true);
    setError(null);
    setResolvedPath(null);
    setVersions([]);

    try {
      const [path, shimVers] = await Promise.all([
        commands.whichCommand(command.trim()).catch(() => null),
        commands.shimVersions(command.trim()).catch(() => [] as ShimVersion[]),
      ]);
      setResolvedPath(path);
      setVersions(shimVers);
    } catch (e) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-border/50 bg-card rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          {t("shims.lookup")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder={t("shims.commandName")}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLookup();
            }}
          />
          <Button
            onClick={handleLookup}
            disabled={isLoading || !command.trim()}
          >
            {isLoading ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Search className="mr-1.5 size-4" />
            )}
            {t("common.search")}
          </Button>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        {resolvedPath !== null && (
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm font-medium">
              {t("shims.resolvedPath")}
            </p>
            <p className="bg-accent/50 rounded-lg px-3 py-2 font-mono text-sm">
              {resolvedPath}
            </p>
          </div>
        )}

        {versions.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-2 text-sm font-medium">
              {t("shims.providedBy")}
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Plugin</TableHead>
                  <TableHead>Version</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((v, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-4 font-medium">
                      {v.plugin}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {v.version}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
