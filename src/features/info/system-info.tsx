import { useTranslation } from "react-i18next";
import { Copy, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { AsdfInfo } from "@/lib/types";

interface SystemInfoProps {
  info: AsdfInfo | null;
  isLoading: boolean;
}

export function SystemInfo({ info, isLoading }: SystemInfoProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!info) return;
    const text = [
      `asdf version: ${info.version}`,
      `OS: ${info.os}`,
      `Shell: ${info.shell}`,
      `ASDF_DIR: ${info.asdf_dir}`,
      `ASDF_DATA_DIR: ${info.asdf_data_dir}`,
      `Plugins: ${info.plugins.join(", ")}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const rows = info
    ? [
        { label: "Version", value: info.version },
        { label: "OS", value: info.os },
        { label: "Shell", value: info.shell },
        { label: "ASDF_DIR", value: info.asdf_dir },
        { label: "ASDF_DATA_DIR", value: info.asdf_data_dir },
        { label: "Plugins", value: info.plugins.join(", ") || "—" },
      ]
    : [];

  return (
    <Card className="border-border/50 bg-card rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">
          {t("info.systemInfo")}
        </CardTitle>
        {info && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="mr-1 size-3" />
                {t("common.copied")}
              </>
            ) : (
              <>
                <Copy className="mr-1 size-3" />
                {t("common.copyToClipboard")}
              </>
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        ) : !info ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Could not load system info
          </p>
        ) : (
          <Table>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="text-muted-foreground w-40 pl-6 font-medium">
                    {row.label}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {row.value}
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
