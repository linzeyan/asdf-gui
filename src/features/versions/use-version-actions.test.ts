import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
  Channel: vi.fn(),
}));

vi.mock("@/lib/commands", () => ({
  setVersion: vi.fn(),
  uninstallVersion: vi.fn(),
  whereInstalled: vi.fn(),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: Object.assign(
    vi.fn(() => vi.fn()),
    {
      getState: vi.fn(() => ({ refreshStatus: vi.fn() })),
    },
  ),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, _opts?: Record<string, string>) => key,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { useVersionActions } from "./use-version-actions";
import * as commands from "@/lib/commands";
import { toast } from "sonner";

describe("useVersionActions", () => {
  const loadPluginData = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial state ──────────────────────────────────────────────

  it("has correct initial state", () => {
    const { result } = renderHook(() =>
      useVersionActions("nodejs", loadPluginData),
    );
    expect(result.current.actionKey).toBeNull();
  });

  // ── handleSetVersion ──────────────────────────────────────────

  it("sets version with Local scope", async () => {
    vi.mocked(commands.setVersion).mockResolvedValue("");

    const { result } = renderHook(() =>
      useVersionActions("nodejs", loadPluginData),
    );

    await act(async () => {
      await result.current.handleSetVersion("20.11.0", "Local");
    });

    expect(commands.setVersion).toHaveBeenCalledWith(
      "nodejs",
      ["20.11.0"],
      "Local",
    );
    expect(toast.success).toHaveBeenCalled();
    expect(loadPluginData).toHaveBeenCalledWith("nodejs");
    expect(result.current.actionKey).toBeNull();
  });

  it("sets version with Home scope", async () => {
    vi.mocked(commands.setVersion).mockResolvedValue("");

    const { result } = renderHook(() =>
      useVersionActions("nodejs", loadPluginData),
    );

    await act(async () => {
      await result.current.handleSetVersion("20.11.0", "Home");
    });

    expect(commands.setVersion).toHaveBeenCalledWith(
      "nodejs",
      ["20.11.0"],
      "Home",
    );
    expect(toast.success).toHaveBeenCalled();
  });

  // ── handleUninstall ──────────────────────────────────────────

  it("uninstalls version and refreshes", async () => {
    vi.mocked(commands.uninstallVersion).mockResolvedValue("");

    const { result } = renderHook(() =>
      useVersionActions("nodejs", loadPluginData),
    );

    await act(async () => {
      await result.current.handleUninstall("20.11.0");
    });

    expect(commands.uninstallVersion).toHaveBeenCalledWith("nodejs", "20.11.0");
    expect(toast.success).toHaveBeenCalled();
    expect(loadPluginData).toHaveBeenCalledWith("nodejs");
    expect(result.current.actionKey).toBeNull();
  });

  // ── handleShowPath ────────────────────────────────────────────

  it("shows installation path via toast.info", async () => {
    vi.mocked(commands.whereInstalled).mockResolvedValue(
      "/home/user/.asdf/installs/nodejs/20.11.0",
    );

    const { result } = renderHook(() =>
      useVersionActions("nodejs", loadPluginData),
    );

    await act(async () => {
      await result.current.handleShowPath("20.11.0");
    });

    expect(commands.whereInstalled).toHaveBeenCalledWith("nodejs", "20.11.0");
    expect(toast.info).toHaveBeenCalledWith(
      "/home/user/.asdf/installs/nodejs/20.11.0",
    );
  });

  // ── Error handling ─────────────────────────────────────────────

  it("shows error toast on handleSetVersion failure", async () => {
    vi.mocked(commands.setVersion).mockRejectedValue(
      new Error("failed to set"),
    );

    const { result } = renderHook(() =>
      useVersionActions("nodejs", loadPluginData),
    );

    await act(async () => {
      await result.current.handleSetVersion("20.11.0", "Local");
    });

    expect(toast.error).toHaveBeenCalled();
    expect(result.current.actionKey).toBeNull();
  });

  it("shows error toast on handleUninstall failure", async () => {
    vi.mocked(commands.uninstallVersion).mockRejectedValue(
      new Error("uninstall failed"),
    );

    const { result } = renderHook(() =>
      useVersionActions("nodejs", loadPluginData),
    );

    await act(async () => {
      await result.current.handleUninstall("20.11.0");
    });

    expect(toast.error).toHaveBeenCalled();
    expect(result.current.actionKey).toBeNull();
  });

  it("shows error toast on handleShowPath failure", async () => {
    vi.mocked(commands.whereInstalled).mockRejectedValue(
      new Error("not found"),
    );

    const { result } = renderHook(() =>
      useVersionActions("nodejs", loadPluginData),
    );

    await act(async () => {
      await result.current.handleShowPath("20.11.0");
    });

    expect(toast.error).toHaveBeenCalled();
  });

  // ── actionKey tracking ─────────────────────────────────────────

  it("actionKey is reset after completion", async () => {
    vi.mocked(commands.setVersion).mockResolvedValue("");

    const { result } = renderHook(() =>
      useVersionActions("nodejs", loadPluginData),
    );

    await act(async () => {
      await result.current.handleSetVersion("20.11.0", "Local");
    });

    expect(result.current.actionKey).toBeNull();
  });
});
