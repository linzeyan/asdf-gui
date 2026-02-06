import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppConfig } from "@/lib/types";

interface GeneralSettingsProps {
  config: AppConfig;
  onUpdate: (patch: Partial<AppConfig>) => void;
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function GeneralSettings({ config, onUpdate }: GeneralSettingsProps) {
  const { t, i18n } = useTranslation();

  function handleLanguageChange(lang: string) {
    i18n.changeLanguage(lang);
    onUpdate({ language: lang });
  }

  return (
    <Card className="border-border/50 bg-card rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          {t("settings.general")}
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-border/50 space-y-0 divide-y">
        <SettingRow label={t("settings.language")}>
          <Select value={config.language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="zh-TW">正體中文</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label={t("settings.theme")}>
          <Select
            value={config.theme}
            onValueChange={(v) => {
              onUpdate({ theme: v });
              // Apply theme to document
              if (v === "dark") {
                document.documentElement.classList.add("dark");
              } else if (v === "light") {
                document.documentElement.classList.remove("dark");
              } else {
                // system
                const prefersDark = window.matchMedia(
                  "(prefers-color-scheme: dark)",
                ).matches;
                document.documentElement.classList.toggle("dark", prefersDark);
              }
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">
                {t("settings.themeSystem")}
              </SelectItem>
              <SelectItem value="light">{t("settings.themeLight")}</SelectItem>
              <SelectItem value="dark">{t("settings.themeDark")}</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow
          label={t("settings.asdfBinaryPath")}
          description={t("settings.asdfBinaryPathDesc")}
        >
          <Input
            className="w-[220px]"
            placeholder="auto-detect"
            value={config.asdf_binary_path ?? ""}
            onChange={(e) =>
              onUpdate({
                asdf_binary_path: e.target.value || null,
              })
            }
          />
        </SettingRow>

        <SettingRow label={t("settings.workingDirectory")}>
          <Input
            className="w-[220px]"
            placeholder="~/"
            value={config.working_directory ?? ""}
            readOnly
          />
        </SettingRow>

        <SettingRow
          label={t("settings.keepDownloads")}
          description={t("settings.keepDownloadsDesc")}
        >
          <input
            type="checkbox"
            className="accent-primary size-4"
            checked={config.keep_downloads}
            onChange={(e) => onUpdate({ keep_downloads: e.target.checked })}
          />
        </SettingRow>

        <SettingRow
          label={t("settings.notifications")}
          description={t("settings.notificationsDesc")}
        >
          <input
            type="checkbox"
            className="accent-primary size-4"
            checked={config.notifications}
            onChange={(e) => onUpdate({ notifications: e.target.checked })}
          />
        </SettingRow>
      </CardContent>
    </Card>
  );
}
