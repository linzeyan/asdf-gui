import { useTranslation } from "react-i18next";
import { Box, Puzzle, Layers, FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EnvironmentSummaryProps {
  asdfVersion: string | null;
  dataDir: string;
  pluginCount: number;
  totalVersions: number;
}

export function EnvironmentSummary({
  asdfVersion,
  dataDir,
  pluginCount,
  totalVersions,
}: EnvironmentSummaryProps) {
  const { t } = useTranslation();

  const stats = [
    {
      label: t("dashboard.asdfVersion"),
      value: asdfVersion ?? "—",
      icon: Box,
    },
    {
      label: t("dashboard.dataDir"),
      value: dataDir || "—",
      icon: FolderOpen,
      truncate: true,
    },
    {
      label: t("dashboard.pluginCount"),
      value: String(pluginCount),
      icon: Puzzle,
    },
    {
      label: t("dashboard.totalVersions"),
      value: String(totalVersions),
      icon: Layers,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="border-border/50 bg-card rounded-xl shadow-sm"
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="bg-accent flex size-10 items-center justify-center rounded-lg">
              <stat.icon className="text-accent-foreground size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs">{stat.label}</p>
              <p
                className={`text-sm font-semibold ${stat.truncate ? "truncate" : ""}`}
                title={stat.truncate ? stat.value : undefined}
              >
                {stat.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
