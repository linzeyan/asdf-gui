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
import type { EnvVar } from "@/lib/types";

export function EnvInspector() {
  const { t } = useTranslation();
  const [command, setCommand] = useState("");
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLookup() {
    if (!command.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await commands.asdfEnv(command.trim());
      setEnvVars(result);
    } catch (e) {
      setError(String(e));
      setEnvVars([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-border/50 bg-card rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          {t("info.envInspector")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder={t("info.commandName")}
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

        {envVars.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-2 text-sm font-medium">
              {t("info.envVars")}
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Key</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {envVars.map((v) => (
                  <TableRow key={v.key}>
                    <TableCell className="pl-4 font-mono text-sm font-medium">
                      {v.key}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground max-w-[400px] truncate font-mono text-sm"
                      title={v.value}
                    >
                      {v.value}
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
