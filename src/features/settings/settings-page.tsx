import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { GeneralSettings } from "./general-settings";
import { AsdfrcViewer } from "./asdfrc-viewer";
import { useSettingsStore } from "@/stores/settings-store";

export function SettingsPage() {
  const { t } = useTranslation();
  const { config, isLoading, updateSettings } = useSettingsStore();

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
      <GeneralSettings config={config} onUpdate={updateSettings} />
      <AsdfrcViewer />
    </div>
  );
}
