import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { StatusBar } from "./status-bar";
import { ProjectPickerDialog } from "@/components/project-picker/project-picker-dialog";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { AsdfNotFound } from "@/components/shared/asdf-not-found";
import { useAppStore } from "@/stores/app-store";
import { useSettingsStore } from "@/stores/settings-store";

function applyTheme(theme: string) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else if (theme === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    document.documentElement.classList.toggle("dark", prefersDark);
  }
}

export function AppLayout() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const refreshStatus = useAppStore((s) => s.refreshStatus);
  const isAsdfAvailable = useAppStore((s) => s.isAsdfAvailable);
  const isLoading = useAppStore((s) => s.isLoading);
  const { loadSettings, config } = useSettingsStore();

  useEffect(() => {
    loadSettings().then(() => {
      refreshStatus();
      // Show project picker on first launch if no working directory set
      const { config: loaded } = useSettingsStore.getState();
      if (loaded && !loaded.working_directory) {
        setPickerOpen(true);
      }
    });
  }, [loadSettings, refreshStatus]);

  // Apply theme from settings
  useEffect(() => {
    if (config?.theme) {
      applyTheme(config.theme);
    }
  }, [config?.theme]);

  // Listen for system theme changes when using "system" theme
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (!config?.theme || config.theme === "system") {
        document.documentElement.classList.toggle("dark", mq.matches);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [config?.theme]);

  // Sync working directory from settings on initial load
  useEffect(() => {
    if (config?.working_directory) {
      useAppStore.setState({ workingDir: config.working_directory });
    }
  }, [config?.working_directory]);

  return (
    <div className="bg-background/50 flex h-screen overflow-hidden">
      <Sidebar onPickProject={() => setPickerOpen(true)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* macOS titlebar spacer for main content */}
        <div className="h-[52px] shrink-0" data-tauri-drag-region="" />

        <main className="flex-1 overflow-y-auto px-6 pb-6">
          <ErrorBoundary>
            {!isLoading && !isAsdfAvailable ? <AsdfNotFound /> : <Outlet />}
          </ErrorBoundary>
        </main>

        <StatusBar onPickProject={() => setPickerOpen(true)} />
      </div>

      <ProjectPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} />
    </div>
  );
}
