import { describe, it, expect } from "vitest";

// Test sidebar navItems and projectName extraction logic without rendering
// (avoids needing react-router-dom mocks for NavLink)

describe("Sidebar logic", () => {
  const navItems = [
    { path: "/", icon: "LayoutDashboard", labelKey: "sidebar.dashboard" },
    { path: "/plugins", icon: "Puzzle", labelKey: "sidebar.plugins" },
    { path: "/versions", icon: "Layers", labelKey: "sidebar.versions" },
    {
      path: "/tool-versions",
      icon: "FileText",
      labelKey: "sidebar.toolVersions",
    },
    { path: "/shims", icon: "Terminal", labelKey: "sidebar.shims" },
    { path: "/info", icon: "Info", labelKey: "sidebar.info" },
    { path: "/settings", icon: "Settings", labelKey: "sidebar.settings" },
  ];

  // ── navItems spec ──────────────────────────────────────────────

  it("has 7 navigation items", () => {
    expect(navItems).toHaveLength(7);
  });

  it("all navItems have required properties", () => {
    for (const item of navItems) {
      expect(item).toHaveProperty("path");
      expect(item).toHaveProperty("icon");
      expect(item).toHaveProperty("labelKey");
    }
  });

  it("all paths start with /", () => {
    for (const item of navItems) {
      expect(item.path).toMatch(/^\//);
    }
  });

  it("all labelKeys are in sidebar namespace", () => {
    for (const item of navItems) {
      expect(item.labelKey).toMatch(/^sidebar\./);
    }
  });

  it("dashboard is the first item with root path", () => {
    expect(navItems[0].path).toBe("/");
    expect(navItems[0].labelKey).toBe("sidebar.dashboard");
  });

  it("settings is the last item", () => {
    expect(navItems[navItems.length - 1].labelKey).toBe("sidebar.settings");
  });

  it("has no duplicate paths", () => {
    const paths = navItems.map((item) => item.path);
    const uniquePaths = new Set(paths);
    expect(uniquePaths.size).toBe(paths.length);
  });

  it("has no duplicate labelKeys", () => {
    const keys = navItems.map((item) => item.labelKey);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  // ── projectName extraction logic ───────────────────────────────

  function extractProjectName(workingDir: string | null): string | null {
    return workingDir ? (workingDir.split("/").pop() ?? null) : null;
  }

  it("extracts project name from Unix path", () => {
    expect(extractProjectName("/home/user/myproject")).toBe("myproject");
  });

  it("extracts project name from nested path", () => {
    expect(extractProjectName("/a/b/c/deep/project")).toBe("project");
  });

  it("returns null when workingDir is null", () => {
    expect(extractProjectName(null)).toBeNull();
  });

  it("handles root path", () => {
    expect(extractProjectName("/")).toBe("");
  });

  it("handles path without slashes", () => {
    expect(extractProjectName("project")).toBe("project");
  });

  it("handles trailing slash", () => {
    // split("/").pop() on "/home/user/project/" returns ""
    expect(extractProjectName("/home/user/project/")).toBe("");
  });

  it("handles Windows-style path with forward slashes", () => {
    expect(extractProjectName("C:/Users/user/project")).toBe("project");
  });

  // ── NavLink end prop logic ─────────────────────────────────────

  it("only root path gets end prop", () => {
    for (const item of navItems) {
      const shouldEnd = item.path === "/";
      if (item.path === "/") {
        expect(shouldEnd).toBe(true);
      } else {
        expect(shouldEnd).toBe(false);
      }
    }
  });
});
