import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Puzzle,
  Layers,
  FileText,
  Terminal,
  Info,
  Settings,
  FolderOpen,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

interface SidebarProps {
  onPickProject: () => void;
}

const navItems = [
  { path: "/", icon: LayoutDashboard, labelKey: "sidebar.dashboard" },
  { path: "/plugins", icon: Puzzle, labelKey: "sidebar.plugins" },
  { path: "/versions", icon: Layers, labelKey: "sidebar.versions" },
  { path: "/tool-versions", icon: FileText, labelKey: "sidebar.toolVersions" },
  { path: "/shims", icon: Terminal, labelKey: "sidebar.shims" },
  { path: "/info", icon: Info, labelKey: "sidebar.info" },
  { path: "/settings", icon: Settings, labelKey: "sidebar.settings" },
];

export function Sidebar({ onPickProject }: SidebarProps) {
  const { t } = useTranslation();
  const workingDir = useAppStore((s) => s.workingDir);
  const projectName = workingDir ? workingDir.split("/").pop() : null;

  return (
    <aside className="border-border/50 bg-sidebar flex w-60 shrink-0 flex-col border-r backdrop-blur-xl">
      {/* macOS titlebar spacer */}
      <div className="h-[52px] shrink-0" data-tauri-drag-region="" />

      {/* Project switcher */}
      <button
        onClick={onPickProject}
        className="hover:bg-accent/50 mx-3 mb-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors"
      >
        <FolderOpen className="text-muted-foreground size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {projectName || t("sidebar.selectProject")}
          </div>
          {workingDir && (
            <div className="text-muted-foreground truncate text-xs">
              {workingDir}
            </div>
          )}
        </div>
        <ChevronRight className="text-muted-foreground size-3.5 shrink-0" />
      </button>

      <div className="border-border/50 mx-3 mb-2 border-t" />

      <nav className="flex-1 space-y-1 px-3 pb-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )
            }
          >
            <item.icon className="size-4 shrink-0" />
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
