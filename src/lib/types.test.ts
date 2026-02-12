import { describe, it, expect, expectTypeOf } from "vitest";
import type {
  Plugin,
  PluginRegistry,
  CurrentVersion,
  LatestInfo,
  ShimVersion,
  EnvVar,
  AsdfInfo,
  ToolVersion,
  SetScope,
  AppConfig,
  InstallEvent,
  RecentProject,
} from "./types";

describe("type definitions", () => {
  it("Plugin has expected shape", () => {
    expectTypeOf<Plugin>().toHaveProperty("name");
    expectTypeOf<Plugin>().toHaveProperty("url");
    expectTypeOf<Plugin>().toHaveProperty("git_ref");
  });

  it("CurrentVersion has expected shape", () => {
    expectTypeOf<CurrentVersion>().toHaveProperty("name");
    expectTypeOf<CurrentVersion>().toHaveProperty("version");
    expectTypeOf<CurrentVersion>().toHaveProperty("source");
    expectTypeOf<CurrentVersion>().toHaveProperty("installed");
  });

  it("ToolVersion has expected shape", () => {
    expectTypeOf<ToolVersion>().toHaveProperty("tool");
    expectTypeOf<ToolVersion>().toHaveProperty("versions");
  });

  it("AppConfig has all required fields", () => {
    expectTypeOf<AppConfig>().toHaveProperty("language");
    expectTypeOf<AppConfig>().toHaveProperty("theme");
    expectTypeOf<AppConfig>().toHaveProperty("asdf_binary_path");
    expectTypeOf<AppConfig>().toHaveProperty("working_directory");
    expectTypeOf<AppConfig>().toHaveProperty("keep_downloads");
    expectTypeOf<AppConfig>().toHaveProperty("notifications");
    expectTypeOf<AppConfig>().toHaveProperty("recent_projects");
  });

  it("InstallEvent is a discriminated union", () => {
    const stdout: InstallEvent = { Stdout: "line" };
    const stderr: InstallEvent = { Stderr: "err" };
    const finished: InstallEvent = { Finished: { success: true } };

    expectTypeOf(stdout).toMatchTypeOf<InstallEvent>();
    expectTypeOf(stderr).toMatchTypeOf<InstallEvent>();
    expectTypeOf(finished).toMatchTypeOf<InstallEvent>();
  });

  // ── Additional type shape tests ────────────────────────────────

  it("PluginRegistry has expected shape", () => {
    expectTypeOf<PluginRegistry>().toHaveProperty("name");
    expectTypeOf<PluginRegistry>().toHaveProperty("url");
  });

  it("LatestInfo has expected shape", () => {
    expectTypeOf<LatestInfo>().toHaveProperty("name");
    expectTypeOf<LatestInfo>().toHaveProperty("latest");
    expectTypeOf<LatestInfo>().toHaveProperty("installed_version");
    expectTypeOf<LatestInfo>().toHaveProperty("up_to_date");
  });

  it("ShimVersion has expected shape", () => {
    expectTypeOf<ShimVersion>().toHaveProperty("plugin");
    expectTypeOf<ShimVersion>().toHaveProperty("version");
  });

  it("EnvVar has expected shape", () => {
    expectTypeOf<EnvVar>().toHaveProperty("key");
    expectTypeOf<EnvVar>().toHaveProperty("value");
  });

  it("AsdfInfo has expected shape", () => {
    expectTypeOf<AsdfInfo>().toHaveProperty("version");
    expectTypeOf<AsdfInfo>().toHaveProperty("os");
    expectTypeOf<AsdfInfo>().toHaveProperty("shell");
    expectTypeOf<AsdfInfo>().toHaveProperty("asdf_dir");
    expectTypeOf<AsdfInfo>().toHaveProperty("asdf_data_dir");
    expectTypeOf<AsdfInfo>().toHaveProperty("plugins");
  });

  it("RecentProject has expected shape", () => {
    expectTypeOf<RecentProject>().toHaveProperty("path");
    expectTypeOf<RecentProject>().toHaveProperty("name");
    expectTypeOf<RecentProject>().toHaveProperty("last_opened");
  });

  // ── Nullable field type checks ─────────────────────────────────

  it("Plugin url is nullable", () => {
    const plugin: Plugin = { name: "test", url: null, git_ref: null };
    expect(plugin.url).toBeNull();
  });

  it("Plugin git_ref is nullable", () => {
    const plugin: Plugin = { name: "test", url: "url", git_ref: null };
    expect(plugin.git_ref).toBeNull();
  });

  it("LatestInfo installed_version is nullable", () => {
    const info: LatestInfo = {
      name: "test",
      latest: "1.0",
      installed_version: null,
      up_to_date: false,
    };
    expect(info.installed_version).toBeNull();
  });

  it("AppConfig asdf_binary_path is nullable", () => {
    const config: AppConfig = {
      language: "en",
      theme: "system",
      asdf_binary_path: null,
      working_directory: null,
      keep_downloads: false,
      notifications: true,
      recent_projects: [],
    };
    expect(config.asdf_binary_path).toBeNull();
  });

  // ── SetScope values ────────────────────────────────────────────

  it("SetScope accepts valid values", () => {
    const local: SetScope = "Local";
    const home: SetScope = "Home";
    const parent: SetScope = "Parent";
    expect(local).toBe("Local");
    expect(home).toBe("Home");
    expect(parent).toBe("Parent");
  });

  // ── Runtime value construction ─────────────────────────────────

  it("can construct a full Plugin object", () => {
    const plugin: Plugin = {
      name: "nodejs",
      url: "https://github.com/asdf-vm/asdf-nodejs.git",
      git_ref: "main",
    };
    expect(plugin.name).toBe("nodejs");
    expect(plugin.url).toContain("asdf-nodejs");
    expect(plugin.git_ref).toBe("main");
  });

  it("can construct a full CurrentVersion object", () => {
    const cv: CurrentVersion = {
      name: "nodejs",
      version: "20.11.0",
      source: "/home/user/.tool-versions",
      installed: true,
    };
    expect(cv.installed).toBe(true);
  });

  it("can construct ToolVersion with multiple versions", () => {
    const tv: ToolVersion = {
      tool: "python",
      versions: ["3.12.1", "3.11.7", "3.10.0"],
    };
    expect(tv.versions).toHaveLength(3);
  });

  it("can construct ToolVersion with empty versions", () => {
    const tv: ToolVersion = {
      tool: "nodejs",
      versions: [],
    };
    expect(tv.versions).toHaveLength(0);
  });

  it("can construct InstallEvent variants", () => {
    const events: InstallEvent[] = [
      { Stdout: "Downloading..." },
      { Stderr: "Warning: ..." },
      { Finished: { success: true } },
      { Finished: { success: false } },
    ];
    expect(events).toHaveLength(4);
  });

  // ── Type consistency with backend ──────────────────────────────

  it("AppConfig recent_projects is an array", () => {
    const config: AppConfig = {
      language: "en",
      theme: "system",
      asdf_binary_path: null,
      working_directory: null,
      keep_downloads: false,
      notifications: true,
      recent_projects: [],
    };
    expect(Array.isArray(config.recent_projects)).toBe(true);
  });

  it("AsdfInfo plugins is an array of strings", () => {
    const info: AsdfInfo = {
      version: "0.14.0",
      os: "linux",
      shell: "/bin/bash",
      asdf_dir: "/home/.asdf",
      asdf_data_dir: "/home/.asdf",
      plugins: ["nodejs", "python"],
    };
    expect(info.plugins.every((p) => typeof p === "string")).toBe(true);
  });
});
