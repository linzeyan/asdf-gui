import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @tauri-apps/api/core before importing the store
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
  Channel: vi.fn(),
}));

// Mock the commands module
vi.mock("@/lib/commands", () => ({
  asdfVersion: vi.fn(),
  pluginList: vi.fn(),
  setWorkingDirectory: vi.fn(),
}));

import { useAppStore } from "./app-store";
import * as commands from "@/lib/commands";

describe("useAppStore", () => {
  beforeEach(() => {
    // Reset store to initial state
    useAppStore.setState({
      workingDir: null,
      asdfVersion: null,
      pluginCount: 0,
      isAsdfAvailable: false,
      isLoading: true,
      error: null,
    });
    vi.clearAllMocks();
  });

  // ── Initial state ──────────────────────────────────────────────

  it("has correct initial state", () => {
    const state = useAppStore.getState();
    expect(state.workingDir).toBeNull();
    expect(state.asdfVersion).toBeNull();
    expect(state.pluginCount).toBe(0);
    expect(state.isAsdfAvailable).toBe(false);
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  // ── refreshStatus ──────────────────────────────────────────────

  it("refreshStatus sets asdf info on success", async () => {
    vi.mocked(commands.asdfVersion).mockResolvedValue("0.14.0");
    vi.mocked(commands.pluginList).mockResolvedValue([
      { name: "nodejs", url: null, git_ref: null },
      { name: "python", url: null, git_ref: null },
    ]);

    await useAppStore.getState().refreshStatus();

    const state = useAppStore.getState();
    expect(state.asdfVersion).toBe("0.14.0");
    expect(state.pluginCount).toBe(2);
    expect(state.isAsdfAvailable).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("refreshStatus sets error and isAsdfAvailable=false on failure", async () => {
    vi.mocked(commands.asdfVersion).mockRejectedValue(
      new Error("asdf not found"),
    );

    await useAppStore.getState().refreshStatus();

    const state = useAppStore.getState();
    expect(state.isAsdfAvailable).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeTruthy();
  });

  it("refreshStatus sets isLoading to true at start", async () => {
    let loadingDuringCall = false;
    vi.mocked(commands.asdfVersion).mockImplementation(async () => {
      loadingDuringCall = useAppStore.getState().isLoading;
      return "0.14.0";
    });
    vi.mocked(commands.pluginList).mockResolvedValue([]);

    await useAppStore.getState().refreshStatus();

    expect(loadingDuringCall).toBe(true);
  });

  it("refreshStatus clears previous error on start", async () => {
    useAppStore.setState({ error: "previous error" });

    vi.mocked(commands.asdfVersion).mockResolvedValue("0.14.0");
    vi.mocked(commands.pluginList).mockResolvedValue([]);

    await useAppStore.getState().refreshStatus();

    expect(useAppStore.getState().error).toBeNull();
  });

  it("refreshStatus handles empty plugin list", async () => {
    vi.mocked(commands.asdfVersion).mockResolvedValue("0.14.0");
    vi.mocked(commands.pluginList).mockResolvedValue([]);

    await useAppStore.getState().refreshStatus();

    expect(useAppStore.getState().pluginCount).toBe(0);
    expect(useAppStore.getState().isAsdfAvailable).toBe(true);
  });

  // ── setWorkingDir ──────────────────────────────────────────────

  it("setWorkingDir updates working directory on success", async () => {
    vi.mocked(commands.setWorkingDirectory).mockResolvedValue({
      language: "en",
      theme: "system",
      asdf_binary_path: null,
      working_directory: "/home/user/project",
      keep_downloads: false,
      notifications: true,
      recent_projects: [],
    });

    await useAppStore.getState().setWorkingDir("/home/user/project");

    expect(useAppStore.getState().workingDir).toBe("/home/user/project");
  });

  it("setWorkingDir sets error on failure", async () => {
    vi.mocked(commands.setWorkingDirectory).mockRejectedValue(
      new Error("directory not found"),
    );

    await useAppStore.getState().setWorkingDir("/nonexistent");

    expect(useAppStore.getState().error).toBeTruthy();
  });

  it("setWorkingDir calls setWorkingDirectory command", async () => {
    vi.mocked(commands.setWorkingDirectory).mockResolvedValue({
      language: "en",
      theme: "system",
      asdf_binary_path: null,
      working_directory: "/path",
      keep_downloads: false,
      notifications: true,
      recent_projects: [],
    });

    await useAppStore.getState().setWorkingDir("/path");

    expect(commands.setWorkingDirectory).toHaveBeenCalledWith("/path");
  });

  // ── State consistency ──────────────────────────────────────────

  it("refreshStatus failure does not affect workingDir", async () => {
    useAppStore.setState({ workingDir: "/existing/dir" });
    vi.mocked(commands.asdfVersion).mockRejectedValue(new Error("fail"));

    await useAppStore.getState().refreshStatus();

    expect(useAppStore.getState().workingDir).toBe("/existing/dir");
  });

  it("setWorkingDir failure does not clear asdf info", async () => {
    useAppStore.setState({
      asdfVersion: "0.14.0",
      isAsdfAvailable: true,
    });
    vi.mocked(commands.setWorkingDirectory).mockRejectedValue(
      new Error("fail"),
    );

    await useAppStore.getState().setWorkingDir("/bad");

    expect(useAppStore.getState().asdfVersion).toBe("0.14.0");
    expect(useAppStore.getState().isAsdfAvailable).toBe(true);
  });
});
