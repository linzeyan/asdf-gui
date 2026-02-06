import { useTranslation } from "react-i18next";
import { Download, Plus, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onInstallAll: () => void;
  onAddPlugin: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  hasUninstalled: boolean;
}

export function QuickActions({
  onInstallAll,
  onAddPlugin,
  onRefresh,
  isRefreshing,
  hasUninstalled,
}: QuickActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      {hasUninstalled && (
        <Button size="sm" variant="default" onClick={onInstallAll}>
          <Download className="mr-1.5 size-3.5" />
          {t("dashboard.installAll")}
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={onAddPlugin}>
        <Plus className="mr-1.5 size-3.5" />
        {t("dashboard.addPlugin")}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
        ) : (
          <RefreshCw className="mr-1.5 size-3.5" />
        )}
        {t("common.refresh")}
      </Button>
    </div>
  );
}
