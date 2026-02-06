import { describe, it, expectTypeOf } from "vitest";
import type {
  Plugin,
  CurrentVersion,
  ToolVersion,
  AppConfig,
  InstallEvent,
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
});
