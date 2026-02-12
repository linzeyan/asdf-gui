import { describe, it, expect } from "vitest";
import type { InstallEvent } from "@/lib/types";

/**
 * Tests for versions page logic: InstallEvent handling,
 * plugin selection via search params, and version action key generation.
 */

describe("Versions page logic", () => {
  // ── InstallEvent stream processing ────────────────────────────

  describe("InstallEvent processing", () => {
    function processEvent(
      event: InstallEvent,
      lines: string[],
    ): { lines: string[]; finished: boolean; success: boolean } {
      if ("Stdout" in event) {
        return {
          lines: [...lines, event.Stdout],
          finished: false,
          success: false,
        };
      } else if ("Stderr" in event) {
        return {
          lines: [...lines, event.Stderr],
          finished: false,
          success: false,
        };
      } else if ("Finished" in event) {
        return { lines, finished: true, success: event.Finished.success };
      }
      return { lines, finished: false, success: false };
    }

    it("appends stdout to lines", () => {
      const result = processEvent({ Stdout: "Downloading..." }, []);
      expect(result.lines).toEqual(["Downloading..."]);
      expect(result.finished).toBe(false);
    });

    it("appends stderr to lines", () => {
      const result = processEvent({ Stderr: "Warning: ..." }, ["line1"]);
      expect(result.lines).toEqual(["line1", "Warning: ..."]);
      expect(result.finished).toBe(false);
    });

    it("marks finished with success", () => {
      const result = processEvent({ Finished: { success: true } }, ["done"]);
      expect(result.finished).toBe(true);
      expect(result.success).toBe(true);
      expect(result.lines).toEqual(["done"]);
    });

    it("marks finished with failure", () => {
      const result = processEvent({ Finished: { success: false } }, []);
      expect(result.finished).toBe(true);
      expect(result.success).toBe(false);
    });

    it("processes a full install sequence", () => {
      const events: InstallEvent[] = [
        { Stdout: "Downloading nodejs 20.11.0..." },
        { Stdout: "Extracting..." },
        { Stderr: "Some warning" },
        { Stdout: "Installing..." },
        { Finished: { success: true } },
      ];

      let lines: string[] = [];
      let finished = false;
      let success = false;

      for (const event of events) {
        const result = processEvent(event, lines);
        lines = result.lines;
        finished = result.finished;
        success = result.success;
      }

      expect(lines).toHaveLength(4);
      expect(finished).toBe(true);
      expect(success).toBe(true);
    });
  });

  // ── actionKey generation ──────────────────────────────────────

  describe("actionKey generation", () => {
    function makeActionKey(version: string, scope: "Local" | "Home"): string {
      const label = scope === "Local" ? "local" : "global";
      return `${label}:${version}`;
    }

    function makeUninstallKey(version: string): string {
      return `uninstall:${version}`;
    }

    it("creates local action key", () => {
      expect(makeActionKey("20.11.0", "Local")).toBe("local:20.11.0");
    });

    it("creates global action key", () => {
      expect(makeActionKey("20.11.0", "Home")).toBe("global:20.11.0");
    });

    it("creates uninstall key", () => {
      expect(makeUninstallKey("20.11.0")).toBe("uninstall:20.11.0");
    });

    it("handles version with special characters", () => {
      expect(makeActionKey("3.12.0-beta.1", "Local")).toBe(
        "local:3.12.0-beta.1",
      );
    });
  });

  // ── Plugin URL encoding for navigation ────────────────────────

  describe("plugin URL encoding", () => {
    function makeVersionsUrl(pluginName: string): string {
      return `/versions?plugin=${encodeURIComponent(pluginName)}`;
    }

    it("encodes simple plugin name", () => {
      expect(makeVersionsUrl("nodejs")).toBe("/versions?plugin=nodejs");
    });

    it("encodes plugin name with special characters", () => {
      expect(makeVersionsUrl("my plugin")).toBe("/versions?plugin=my%20plugin");
    });

    it("handles hyphenated names", () => {
      expect(makeVersionsUrl("my-plugin")).toBe("/versions?plugin=my-plugin");
    });
  });

  // ── latestInstallingKey format ─────────────────────────────────

  describe("latestInstallingKey format", () => {
    function makeLatestKey(name: string, version: string): string {
      return `${name}@${version}`;
    }

    it("matches the expected format", () => {
      expect(makeLatestKey("nodejs", "22.0.0")).toBe("nodejs@22.0.0");
    });
  });
});
