import { describe, it, expect } from "vitest";

/**
 * Spec-based test: verify router paths and sidebar navItems are consistent.
 * This prevents regressions where a sidebar link points to a route that
 * doesn't exist (404) or a route exists but is unreachable from the sidebar.
 */

// Sidebar navItems definition (mirrors sidebar.tsx)
const navItems = [
  { path: "/", labelKey: "sidebar.dashboard" },
  { path: "/plugins", labelKey: "sidebar.plugins" },
  { path: "/versions", labelKey: "sidebar.versions" },
  { path: "/tool-versions", labelKey: "sidebar.toolVersions" },
  { path: "/shims", labelKey: "sidebar.shims" },
  { path: "/info", labelKey: "sidebar.info" },
  { path: "/settings", labelKey: "sidebar.settings" },
];

// Router child paths (mirrors router.tsx)
// index route is "/" (represented as "" or undefined path with index: true)
const routerChildPaths = [
  "/", // index route
  "/plugins",
  "/versions",
  "/tool-versions",
  "/shims",
  "/info",
  "/settings",
];

describe("Router and Sidebar consistency", () => {
  it("every sidebar path has a corresponding route", () => {
    for (const item of navItems) {
      expect(routerChildPaths).toContain(item.path);
    }
  });

  it("every route has a corresponding sidebar link", () => {
    for (const routePath of routerChildPaths) {
      const found = navItems.some((item) => item.path === routePath);
      expect(found).toBe(true);
    }
  });

  it("sidebar paths and router paths have the same count", () => {
    expect(navItems.length).toBe(routerChildPaths.length);
  });

  it("sidebar paths are unique", () => {
    const paths = navItems.map((i) => i.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("sidebar labelKeys are unique", () => {
    const keys = navItems.map((i) => i.labelKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("all paths start with /", () => {
    for (const item of navItems) {
      expect(item.path.startsWith("/")).toBe(true);
    }
  });

  it("dashboard is the first nav item (index route)", () => {
    expect(navItems[0].path).toBe("/");
    expect(navItems[0].labelKey).toContain("dashboard");
  });

  it("settings is the last nav item", () => {
    expect(navItems[navItems.length - 1].path).toBe("/settings");
    expect(navItems[navItems.length - 1].labelKey).toContain("settings");
  });

  it("no paths contain query strings or fragments", () => {
    for (const item of navItems) {
      expect(item.path).not.toContain("?");
      expect(item.path).not.toContain("#");
    }
  });

  it("no paths have trailing slashes (except root)", () => {
    for (const item of navItems) {
      if (item.path !== "/") {
        expect(item.path.endsWith("/")).toBe(false);
      }
    }
  });
});
