import { useTranslation } from "react-i18next";
import { open } from "@tauri-apps/plugin-dialog";
import { Folder, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app-store";
import { useSettingsStore } from "@/stores/settings-store";
import { writeConfig } from "@/lib/commands";
import type { RecentProject } from "@/lib/types";

interface ProjectPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectPickerDialog({
  open: isOpen,
  onOpenChange,
}: ProjectPickerDialogProps) {
  const { t } = useTranslation();
  const { setWorkingDir, refreshStatus } = useAppStore();
  const { config, loadSettings } = useSettingsStore();

  const recentProjects = config?.recent_projects ?? [];

  async function handleBrowse() {
    const selected = await open({ directory: true, multiple: false });
    if (selected) {
      await selectProject(selected as string);
    }
  }

  async function selectProject(path: string) {
    await setWorkingDir(path);
    await loadSettings();
    await refreshStatus();
    onOpenChange(false);
  }

  async function removeRecent(path: string) {
    if (!config) return;
    const updated = {
      ...config,
      recent_projects: config.recent_projects.filter((p) => p.path !== path),
    };
    await writeConfig(updated);
    await loadSettings();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t("projectPicker.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Button onClick={handleBrowse} variant="outline" className="w-full">
            <Folder className="mr-2 size-4" />
            {t("projectPicker.browseFolder")}
          </Button>

          <div>
            <h4 className="text-muted-foreground mb-2 text-sm font-medium">
              {t("projectPicker.recentProjects")}
            </h4>
            {recentProjects.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {t("projectPicker.noRecent")}
              </p>
            ) : (
              <div className="space-y-1">
                {recentProjects.map((project: RecentProject) => (
                  <div
                    key={project.path}
                    className="group hover:bg-accent/50 flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"
                  >
                    <button
                      className="flex flex-1 flex-col items-start text-left"
                      onClick={() => selectProject(project.path)}
                    >
                      <span className="text-sm font-medium">
                        {project.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {project.path}
                      </span>
                    </button>
                    <button
                      onClick={() => removeRecent(project.path)}
                      className="hover:bg-accent shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
