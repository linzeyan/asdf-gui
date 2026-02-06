import { createHashRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { PluginsPage } from "@/features/plugins/plugins-page";
import { VersionsPage } from "@/features/versions/versions-page";
import { ToolVersionsPage } from "@/features/tool-versions/tool-versions-page";
import { ShimsPage } from "@/features/shims/shims-page";
import { InfoPage } from "@/features/info/info-page";
import { SettingsPage } from "@/features/settings/settings-page";

export const router = createHashRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "plugins", element: <PluginsPage /> },
      { path: "versions", element: <VersionsPage /> },
      { path: "tool-versions", element: <ToolVersionsPage /> },
      { path: "shims", element: <ShimsPage /> },
      { path: "info", element: <InfoPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
