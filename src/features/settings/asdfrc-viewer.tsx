import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
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

export function AsdfrcViewer() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<[string, string][]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    commands
      .readAsdfrc()
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Card className="border-border/50 bg-card rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          {t("settings.asdfrc")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            {t("settings.asdfrcEmpty")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Key</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell className="pl-6 font-mono text-sm font-medium">
                    {key}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {value}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
