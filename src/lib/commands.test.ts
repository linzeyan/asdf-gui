import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Tauri core API
const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
  Channel: vi.fn().mockImplementation(() => ({
    onmessage: null,
  })),
}));

import * as commands from "./commands";

describe("commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Info commands ──────────────────────────────────────────────

  describe("info commands", () => {
    it("asdfVersion invokes asdf_version", async () => {
      mockInvoke.mockResolvedValue("0.14.0");
      const result = await commands.asdfVersion();
      expect(mockInvoke).toHaveBeenCalledWith("asdf_version");
      expect(result).toBe("0.14.0");
    });

    it("asdfInfo invokes asdf_info", async () => {
      const mockInfo = {
        version: "0.14.0",
        os: "linux",
        shell: "/bin/bash",
        asdf_dir: "/home/user/.asdf",
        asdf_data_dir: "/home/user/.asdf",
        plugins: ["nodejs"],
      };
      mockInvoke.mockResolvedValue(mockInfo);
      const result = await commands.asdfInfo();
      expect(mockInvoke).toHaveBeenCalledWith("asdf_info");
      expect(result).toEqual(mockInfo);
    });

    it("asdfEnv invokes asdf_env with command", async () => {
      mockInvoke.mockResolvedValue([]);
      await commands.asdfEnv("node");
      expect(mockInvoke).toHaveBeenCalledWith("asdf_env", { command: "node" });
    });
  });

  // ── Plugin commands ────────────────────────────────────────────

  describe("plugin commands", () => {
    it("pluginList invokes with urls and refs flags", async () => {
      mockInvoke.mockResolvedValue([]);
      await commands.pluginList(true, true);
      expect(mockInvoke).toHaveBeenCalledWith("plugin_list", {
        urls: true,
        refs: true,
      });
    });

    it("pluginList invokes with false flags", async () => {
      mockInvoke.mockResolvedValue([]);
      await commands.pluginList(false, false);
      expect(mockInvoke).toHaveBeenCalledWith("plugin_list", {
        urls: false,
        refs: false,
      });
    });

    it("pluginListAll invokes plugin_list_all", async () => {
      mockInvoke.mockResolvedValue([]);
      await commands.pluginListAll();
      expect(mockInvoke).toHaveBeenCalledWith("plugin_list_all");
    });

    it("pluginAdd invokes with name only", async () => {
      mockInvoke.mockResolvedValue("");
      await commands.pluginAdd("nodejs");
      expect(mockInvoke).toHaveBeenCalledWith("plugin_add", {
        name: "nodejs",
        gitUrl: undefined,
      });
    });

    it("pluginAdd invokes with name and gitUrl", async () => {
      mockInvoke.mockResolvedValue("");
      await commands.pluginAdd("custom", "https://github.com/example.git");
      expect(mockInvoke).toHaveBeenCalledWith("plugin_add", {
        name: "custom",
        gitUrl: "https://github.com/example.git",
      });
    });

    it("pluginRemove invokes with name", async () => {
      mockInvoke.mockResolvedValue("");
      await commands.pluginRemove("nodejs");
      expect(mockInvoke).toHaveBeenCalledWith("plugin_remove", {
        name: "nodejs",
      });
    });

    it("pluginUpdate invokes with name", async () => {
      mockInvoke.mockResolvedValue("");
      await commands.pluginUpdate("nodejs");
      expect(mockInvoke).toHaveBeenCalledWith("plugin_update", {
        name: "nodejs",
        all: false,
      });
    });

    it("pluginUpdate invokes with all flag", async () => {
      mockInvoke.mockResolvedValue("");
      await commands.pluginUpdate(undefined, true);
      expect(mockInvoke).toHaveBeenCalledWith("plugin_update", {
        name: undefined,
        all: true,
      });
    });
  });

  // ── Version commands ───────────────────────────────────────────

  describe("version commands", () => {
    it("currentVersions invokes current with optional name", async () => {
      mockInvoke.mockResolvedValue([]);
      await commands.currentVersions("nodejs");
      expect(mockInvoke).toHaveBeenCalledWith("current", { name: "nodejs" });
    });

    it("currentVersions invokes current without name", async () => {
      mockInvoke.mockResolvedValue([]);
      await commands.currentVersions();
      expect(mockInvoke).toHaveBeenCalledWith("current", {
        name: undefined,
      });
    });

    it("uninstallVersion invokes uninstall", async () => {
      mockInvoke.mockResolvedValue("");
      await commands.uninstallVersion("nodejs", "20.11.0");
      expect(mockInvoke).toHaveBeenCalledWith("uninstall", {
        name: "nodejs",
        version: "20.11.0",
      });
    });

    it("setVersion invokes set_version with scope", async () => {
      mockInvoke.mockResolvedValue("");
      await commands.setVersion("nodejs", ["20.11.0"], "Local");
      expect(mockInvoke).toHaveBeenCalledWith("set_version", {
        name: "nodejs",
        versions: ["20.11.0"],
        scope: "Local",
      });
    });

    it("setVersion supports multiple versions", async () => {
      mockInvoke.mockResolvedValue("");
      await commands.setVersion("python", ["3.12.1", "3.11.7"], "Home");
      expect(mockInvoke).toHaveBeenCalledWith("set_version", {
        name: "python",
        versions: ["3.12.1", "3.11.7"],
        scope: "Home",
      });
    });

    it("latestVersion invokes latest with name", async () => {
      mockInvoke.mockResolvedValue("20.11.0");
      await commands.latestVersion("nodejs");
      expect(mockInvoke).toHaveBeenCalledWith("latest", {
        name: "nodejs",
        filter: undefined,
      });
    });

    it("latestVersion invokes latest with filter", async () => {
      mockInvoke.mockResolvedValue("20.11.0");
      await commands.latestVersion("nodejs", "20");
      expect(mockInvoke).toHaveBeenCalledWith("latest", {
        name: "nodejs",
        filter: "20",
      });
    });

    it("latestAll invokes latest_all", async () => {
      mockInvoke.mockResolvedValue([]);
      await commands.latestAll();
      expect(mockInvoke).toHaveBeenCalledWith("latest_all");
    });

    it("listInstalled invokes list_installed", async () => {
      mockInvoke.mockResolvedValue([]);
      await commands.listInstalled("nodejs");
      expect(mockInvoke).toHaveBeenCalledWith("list_installed", {
        name: "nodejs",
      });
    });

    it("listAll invokes list_all with optional filter", async () => {
      mockInvoke.mockResolvedValue([]);
      await commands.listAll("nodejs", "20");
      expect(mockInvoke).toHaveBeenCalledWith("list_all", {
        name: "nodejs",
        filter: "20",
      });
    });

    it("whereInstalled invokes where_installed", async () => {
      mockInvoke.mockResolvedValue("/path");
      await commands.whereInstalled("nodejs", "20.11.0");
      expect(mockInvoke).toHaveBeenCalledWith("where_installed", {
        name: "nodejs",
        version: "20.11.0",
      });
    });
  });

  // ── Shim commands ──────────────────────────────────────────────

  describe("shim commands", () => {
    it("whichCommand invokes which_command", async () => {
      mockInvoke.mockResolvedValue("/path/to/node");
      await commands.whichCommand("node");
      expect(mockInvoke).toHaveBeenCalledWith("which_command", {
        command: "node",
      });
    });

    it("shimVersions invokes shim_versions", async () => {
      mockInvoke.mockResolvedValue([]);
      await commands.shimVersions("node");
      expect(mockInvoke).toHaveBeenCalledWith("shim_versions", {
        command: "node",
      });
    });

    it("reshim invokes reshim", async () => {
      mockInvoke.mockResolvedValue("");
      await commands.reshim("nodejs", "20.11.0");
      expect(mockInvoke).toHaveBeenCalledWith("reshim", {
        name: "nodejs",
        version: "20.11.0",
      });
    });
  });

  // ── Tool versions commands ─────────────────────────────────────

  describe("tool versions commands", () => {
    it("readToolVersions invokes read_tool_versions", async () => {
      mockInvoke.mockResolvedValue([]);
      await commands.readToolVersions("/path/.tool-versions");
      expect(mockInvoke).toHaveBeenCalledWith("read_tool_versions", {
        path: "/path/.tool-versions",
      });
    });

    it("writeToolVersions invokes write_tool_versions", async () => {
      mockInvoke.mockResolvedValue(undefined);
      const entries = [{ tool: "nodejs", versions: ["20.11.0"] }];
      await commands.writeToolVersions("/path/.tool-versions", entries);
      expect(mockInvoke).toHaveBeenCalledWith("write_tool_versions", {
        path: "/path/.tool-versions",
        entries,
      });
    });

    it("getToolVersionsPath invokes get_tool_versions_path", async () => {
      mockInvoke.mockResolvedValue("/home/user/.tool-versions");
      await commands.getToolVersionsPath("Home");
      expect(mockInvoke).toHaveBeenCalledWith("get_tool_versions_path", {
        scope: "Home",
      });
    });
  });

  // ── Settings commands ──────────────────────────────────────────

  describe("settings commands", () => {
    it("readConfig invokes read_config", async () => {
      mockInvoke.mockResolvedValue({});
      await commands.readConfig();
      expect(mockInvoke).toHaveBeenCalledWith("read_config");
    });

    it("writeConfig invokes write_config with config", async () => {
      const config = {
        language: "en",
        theme: "system",
        asdf_binary_path: null,
        working_directory: null,
        keep_downloads: false,
        notifications: true,
        recent_projects: [],
      };
      mockInvoke.mockResolvedValue(undefined);
      await commands.writeConfig(config);
      expect(mockInvoke).toHaveBeenCalledWith("write_config", { config });
    });

    it("setWorkingDirectory invokes set_working_directory", async () => {
      mockInvoke.mockResolvedValue({});
      await commands.setWorkingDirectory("/new/path");
      expect(mockInvoke).toHaveBeenCalledWith("set_working_directory", {
        path: "/new/path",
      });
    });

    it("readAsdfrc invokes read_asdfrc", async () => {
      mockInvoke.mockResolvedValue([]);
      await commands.readAsdfrc();
      expect(mockInvoke).toHaveBeenCalledWith("read_asdfrc");
    });
  });

  // ── installVersion streaming ───────────────────────────────────

  describe("installVersion", () => {
    it("invokes install with all params", async () => {
      mockInvoke.mockResolvedValue(undefined);
      const onEvent = vi.fn();

      await commands.installVersion("nodejs", "20.11.0", false, null, onEvent);

      expect(mockInvoke).toHaveBeenCalledWith("install", {
        name: "nodejs",
        version: "20.11.0",
        keepDownload: false,
        cwd: null,
        onOutput: expect.any(Object),
      });
    });

    it("invokes install with null name and version", async () => {
      mockInvoke.mockResolvedValue(undefined);
      const onEvent = vi.fn();

      await commands.installVersion(null, null, false, null, onEvent);

      expect(mockInvoke).toHaveBeenCalledWith("install", {
        name: null,
        version: null,
        keepDownload: false,
        cwd: null,
        onOutput: expect.any(Object),
      });
    });

    it("invokes install with keepDownload true", async () => {
      mockInvoke.mockResolvedValue(undefined);
      const onEvent = vi.fn();

      await commands.installVersion("nodejs", "20.0.0", true, "/cwd", onEvent);

      expect(mockInvoke).toHaveBeenCalledWith("install", {
        name: "nodejs",
        version: "20.0.0",
        keepDownload: true,
        cwd: "/cwd",
        onOutput: expect.any(Object),
      });
    });
  });

  // ── Error propagation ──────────────────────────────────────────

  describe("error propagation", () => {
    it("propagates invoke errors", async () => {
      mockInvoke.mockRejectedValue(new Error("IPC failed"));
      await expect(commands.asdfVersion()).rejects.toThrow("IPC failed");
    });

    it("propagates string errors from backend", async () => {
      mockInvoke.mockRejectedValue("asdf binary not found");
      await expect(commands.pluginList(false, false)).rejects.toBe(
        "asdf binary not found",
      );
    });
  });
});
