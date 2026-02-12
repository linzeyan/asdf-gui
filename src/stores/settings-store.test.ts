import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
  Channel: vi.fn(),
}));

vi.mock("@/lib/commands", () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
}));

import { useSettingsStore } from "./settings-store";
import * as commands from "@/lib/commands";
import type { AppConfig } from "@/lib/types";

const defaultConfig: AppConfig = {
  language: "en",
  theme: "system",
  asdf_binary_path: null,
  working_directory: null,
  keep_downloads: false,
  notifications: true,
  recent_projects: [],
};

describe("useSettingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      config: null,
      isLoading: true,
    });
    vi.clearAllMocks();
  });

  // ── Initial state ──────────────────────────────────────────────

  it("has correct initial state", () => {
    const state = useSettingsStore.getState();
    expect(state.config).toBeNull();
    expect(state.isLoading).toBe(true);
  });

  // ── loadSettings ───────────────────────────────────────────────

  it("loadSettings loads config successfully", async () => {
    vi.mocked(commands.readConfig).mockResolvedValue(defaultConfig);

    await useSettingsStore.getState().loadSettings();

    const state = useSettingsStore.getState();
    expect(state.config).toEqual(defaultConfig);
    expect(state.isLoading).toBe(false);
  });

  it("loadSettings handles error gracefully", async () => {
    vi.mocked(commands.readConfig).mockRejectedValue(new Error("fail"));

    await useSettingsStore.getState().loadSettings();

    const state = useSettingsStore.getState();
    expect(state.config).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it("loadSettings sets isLoading during call", async () => {
    let loadingDuringCall = false;
    vi.mocked(commands.readConfig).mockImplementation(async () => {
      loadingDuringCall = useSettingsStore.getState().isLoading;
      return defaultConfig;
    });

    await useSettingsStore.getState().loadSettings();

    expect(loadingDuringCall).toBe(true);
  });

  // ── updateSettings ─────────────────────────────────────────────

  it("updateSettings merges patch with current config", async () => {
    useSettingsStore.setState({ config: { ...defaultConfig } });
    vi.mocked(commands.writeConfig).mockResolvedValue();

    await useSettingsStore.getState().updateSettings({ theme: "dark" });

    const state = useSettingsStore.getState();
    expect(state.config?.theme).toBe("dark");
    expect(state.config?.language).toBe("en"); // Unchanged
  });

  it("updateSettings calls writeConfig with merged config", async () => {
    useSettingsStore.setState({ config: { ...defaultConfig } });
    vi.mocked(commands.writeConfig).mockResolvedValue();

    await useSettingsStore.getState().updateSettings({ language: "zh-TW" });

    expect(commands.writeConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        language: "zh-TW",
        theme: "system",
      }),
    );
  });

  it("updateSettings does nothing if config is null", async () => {
    useSettingsStore.setState({ config: null });

    await useSettingsStore.getState().updateSettings({ theme: "dark" });

    expect(commands.writeConfig).not.toHaveBeenCalled();
    expect(useSettingsStore.getState().config).toBeNull();
  });

  it("updateSettings can update multiple fields at once", async () => {
    useSettingsStore.setState({ config: { ...defaultConfig } });
    vi.mocked(commands.writeConfig).mockResolvedValue();

    await useSettingsStore.getState().updateSettings({
      theme: "dark",
      language: "zh-TW",
      keep_downloads: true,
    });

    const state = useSettingsStore.getState();
    expect(state.config?.theme).toBe("dark");
    expect(state.config?.language).toBe("zh-TW");
    expect(state.config?.keep_downloads).toBe(true);
  });

  it("updateSettings can set nullable fields", async () => {
    useSettingsStore.setState({ config: { ...defaultConfig } });
    vi.mocked(commands.writeConfig).mockResolvedValue();

    await useSettingsStore
      .getState()
      .updateSettings({ asdf_binary_path: "/usr/local/bin/asdf" });

    expect(useSettingsStore.getState().config?.asdf_binary_path).toBe(
      "/usr/local/bin/asdf",
    );
  });

  it("updateSettings can clear nullable fields back to null", async () => {
    useSettingsStore.setState({
      config: {
        ...defaultConfig,
        asdf_binary_path: "/usr/local/bin/asdf",
      },
    });
    vi.mocked(commands.writeConfig).mockResolvedValue();

    await useSettingsStore
      .getState()
      .updateSettings({ asdf_binary_path: null });

    expect(useSettingsStore.getState().config?.asdf_binary_path).toBeNull();
  });

  // ── State consistency ──────────────────────────────────────────

  it("loadSettings replaces previous config entirely", async () => {
    useSettingsStore.setState({
      config: { ...defaultConfig, theme: "dark" },
    });

    const newConfig = { ...defaultConfig, theme: "light" };
    vi.mocked(commands.readConfig).mockResolvedValue(newConfig);

    await useSettingsStore.getState().loadSettings();

    expect(useSettingsStore.getState().config?.theme).toBe("light");
  });

  it("updateSettings preserves recent_projects", async () => {
    const configWithProjects: AppConfig = {
      ...defaultConfig,
      recent_projects: [
        { path: "/project1", name: "project1", last_opened: 1000 },
        { path: "/project2", name: "project2", last_opened: 2000 },
      ],
    };
    useSettingsStore.setState({ config: configWithProjects });
    vi.mocked(commands.writeConfig).mockResolvedValue();

    await useSettingsStore.getState().updateSettings({ theme: "dark" });

    expect(useSettingsStore.getState().config?.recent_projects).toHaveLength(2);
  });
});
