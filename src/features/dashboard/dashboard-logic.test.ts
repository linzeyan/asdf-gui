import { describe, it, expect } from "vitest";
import type { CurrentVersion, AsdfInfo } from "@/lib/types";

/**
 * Tests for dashboard page logic (pure functions / data transforms)
 * extracted from dashboard-page.tsx. These verify the business logic
 * without needing component rendering.
 */

describe("Dashboard logic", () => {
  // ── hasUninstalled ─────────────────────────────────────────────

  describe("hasUninstalled detection", () => {
    function hasUninstalled(versions: CurrentVersion[]): boolean {
      return versions.some((v) => !v.installed);
    }

    it("returns false for empty versions", () => {
      expect(hasUninstalled([])).toBe(false);
    });

    it("returns false when all versions are installed", () => {
      const versions: CurrentVersion[] = [
        {
          name: "nodejs",
          version: "20.11.0",
          source: ".tool-versions",
          installed: true,
        },
        {
          name: "python",
          version: "3.12.1",
          source: ".tool-versions",
          installed: true,
        },
      ];
      expect(hasUninstalled(versions)).toBe(false);
    });

    it("returns true when any version is not installed", () => {
      const versions: CurrentVersion[] = [
        {
          name: "nodejs",
          version: "20.11.0",
          source: ".tool-versions",
          installed: true,
        },
        {
          name: "python",
          version: "3.12.1",
          source: ".tool-versions",
          installed: false,
        },
      ];
      expect(hasUninstalled(versions)).toBe(true);
    });

    it("returns true when all versions are not installed", () => {
      const versions: CurrentVersion[] = [
        {
          name: "nodejs",
          version: "20.11.0",
          source: ".tool-versions",
          installed: false,
        },
        {
          name: "python",
          version: "3.12.1",
          source: ".tool-versions",
          installed: false,
        },
      ];
      expect(hasUninstalled(versions)).toBe(true);
    });
  });

  // ── totalVersions fallback ────────────────────────────────────

  describe("totalVersions calculation", () => {
    function totalVersions(info: AsdfInfo | null, pluginCount: number): number {
      return info?.plugins.length ?? pluginCount;
    }

    it("uses info.plugins.length when info is available", () => {
      const info: AsdfInfo = {
        version: "0.14.0",
        os: "linux",
        shell: "/bin/bash",
        asdf_dir: "/home/.asdf",
        asdf_data_dir: "/home/.asdf",
        plugins: ["nodejs", "python", "ruby"],
      };
      expect(totalVersions(info, 0)).toBe(3);
    });

    it("falls back to pluginCount when info is null", () => {
      expect(totalVersions(null, 5)).toBe(5);
    });

    it("uses 0 when info.plugins is empty", () => {
      const info: AsdfInfo = {
        version: "0.14.0",
        os: "linux",
        shell: "/bin/bash",
        asdf_dir: "/home/.asdf",
        asdf_data_dir: "/home/.asdf",
        plugins: [],
      };
      expect(totalVersions(info, 10)).toBe(0);
    });
  });

  // ── installAll filtering ──────────────────────────────────────

  describe("installAll filtering", () => {
    function getUninstalled(versions: CurrentVersion[]): CurrentVersion[] {
      return versions.filter((v) => !v.installed);
    }

    it("returns empty array when all installed", () => {
      const versions: CurrentVersion[] = [
        {
          name: "nodejs",
          version: "20.11.0",
          source: ".tool-versions",
          installed: true,
        },
      ];
      expect(getUninstalled(versions)).toEqual([]);
    });

    it("returns only uninstalled versions", () => {
      const versions: CurrentVersion[] = [
        {
          name: "nodejs",
          version: "20.11.0",
          source: ".tool-versions",
          installed: true,
        },
        {
          name: "python",
          version: "3.12.1",
          source: ".tool-versions",
          installed: false,
        },
        {
          name: "ruby",
          version: "3.3.0",
          source: ".tool-versions",
          installed: false,
        },
      ];
      const result = getUninstalled(versions);
      expect(result).toHaveLength(2);
      expect(result.map((v) => v.name)).toEqual(["python", "ruby"]);
    });

    it("preserves order", () => {
      const versions: CurrentVersion[] = [
        {
          name: "z-plugin",
          version: "1.0",
          source: ".tool-versions",
          installed: false,
        },
        {
          name: "a-plugin",
          version: "2.0",
          source: ".tool-versions",
          installed: false,
        },
      ];
      const result = getUninstalled(versions);
      expect(result[0].name).toBe("z-plugin");
      expect(result[1].name).toBe("a-plugin");
    });
  });

  // ── Environment summary fallbacks ─────────────────────────────

  describe("environment summary display values", () => {
    function getDisplayValue(
      asdfVersion: string | null,
      dataDir: string,
    ): { versionDisplay: string; dataDirDisplay: string } {
      return {
        versionDisplay: asdfVersion ?? "—",
        dataDirDisplay: dataDir || "—",
      };
    }

    it("shows version when available", () => {
      const { versionDisplay } = getDisplayValue("0.14.0", "/data");
      expect(versionDisplay).toBe("0.14.0");
    });

    it("shows — when version is null", () => {
      const { versionDisplay } = getDisplayValue(null, "/data");
      expect(versionDisplay).toBe("—");
    });

    it("shows dataDir when available", () => {
      const { dataDirDisplay } = getDisplayValue("0.14.0", "/home/.asdf");
      expect(dataDirDisplay).toBe("/home/.asdf");
    });

    it("shows — when dataDir is empty string", () => {
      const { dataDirDisplay } = getDisplayValue("0.14.0", "");
      expect(dataDirDisplay).toBe("—");
    });
  });

  // ── installingKey format ──────────────────────────────────────

  describe("installingKey format", () => {
    function makeInstallingKey(name: string, version: string): string {
      return `${name}@${version}`;
    }

    it("creates correct key format", () => {
      expect(makeInstallingKey("nodejs", "20.11.0")).toBe("nodejs@20.11.0");
    });

    it("handles version with prerelease", () => {
      expect(makeInstallingKey("nodejs", "21.0.0-rc.1")).toBe(
        "nodejs@21.0.0-rc.1",
      );
    });

    it("handles special characters in plugin name", () => {
      expect(makeInstallingKey("my-plugin", "1.0")).toBe("my-plugin@1.0");
    });
  });
});
