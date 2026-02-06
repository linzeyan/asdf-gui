import { useTranslation } from "react-i18next";
import { Folder } from "lucide-react";
import { useAppStore } from "@/stores/app-store";

interface StatusBarProps {
  onPickProject: () => void;
}

export function StatusBar({ onPickProject }: StatusBarProps) {
  const { t } = useTranslation();
  const { asdfVersion, pluginCount, workingDir } = useAppStore();

  return (
    <div className="border-border/50 bg-sidebar/50 text-muted-foreground flex h-7 shrink-0 items-center gap-4 border-t px-4 text-xs backdrop-blur-xl">
      {asdfVersion && <span>asdf {asdfVersion}</span>}
      {pluginCount > 0 && (
        <span>{t("statusBar.pluginCount", { count: pluginCount })}</span>
      )}
      <div className="flex-1" />
      {workingDir && (
        <button
          onClick={onPickProject}
          className="hover:bg-accent/50 hover:text-foreground flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors"
          title={t("statusBar.clickToChangeDir")}
        >
          <Folder className="size-3" />
          <span className="max-w-[300px] truncate">{workingDir}</span>
        </button>
      )}
    </div>
  );
}
