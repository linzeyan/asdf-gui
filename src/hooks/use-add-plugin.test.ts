import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
  Channel: vi.fn(),
}));

vi.mock("@/lib/commands", () => ({
  pluginListAll: vi.fn(),
  pluginAdd: vi.fn(),
}));

import { useAddPlugin } from "./use-add-plugin";
import * as commands from "@/lib/commands";

describe("useAddPlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial state ──────────────────────────────────────────────

  it("has correct initial state", () => {
    const { result } = renderHook(() => useAddPlugin());
    expect(result.current.showAddPlugin).toBe(false);
    expect(result.current.registry).toEqual([]);
    expect(result.current.registryLoading).toBe(false);
  });

  // ── openAddPlugin ──────────────────────────────────────────────

  it("sets showAddPlugin to true on open", async () => {
    vi.mocked(commands.pluginListAll).mockResolvedValue([]);
    const { result } = renderHook(() => useAddPlugin());

    await act(async () => {
      await result.current.openAddPlugin();
    });

    expect(result.current.showAddPlugin).toBe(true);
  });

  it("loads registry on first open", async () => {
    const mockRegistry = [
      { name: "nodejs", url: "https://github.com/example.git" },
      { name: "python", url: "https://github.com/example2.git" },
    ];
    vi.mocked(commands.pluginListAll).mockResolvedValue(mockRegistry);

    const { result } = renderHook(() => useAddPlugin());

    await act(async () => {
      await result.current.openAddPlugin();
    });

    expect(commands.pluginListAll).toHaveBeenCalledTimes(1);
    expect(result.current.registry).toEqual(mockRegistry);
    expect(result.current.registryLoading).toBe(false);
  });

  it("does not reload registry on subsequent opens", async () => {
    vi.mocked(commands.pluginListAll).mockResolvedValue([
      { name: "nodejs", url: "https://github.com/example.git" },
    ]);

    const { result } = renderHook(() => useAddPlugin());

    // First open - loads registry
    await act(async () => {
      await result.current.openAddPlugin();
    });

    // Close
    act(() => {
      result.current.setShowAddPlugin(false);
    });

    // Second open - should NOT reload
    await act(async () => {
      await result.current.openAddPlugin();
    });

    expect(commands.pluginListAll).toHaveBeenCalledTimes(1);
  });

  it("handles registry load error gracefully", async () => {
    vi.mocked(commands.pluginListAll).mockRejectedValue(
      new Error("network error"),
    );

    const { result } = renderHook(() => useAddPlugin());

    await act(async () => {
      await result.current.openAddPlugin();
    });

    expect(result.current.registry).toEqual([]);
    expect(result.current.registryLoading).toBe(false);
  });

  // ── addPlugin ──────────────────────────────────────────────────

  it("adds plugin with name only", async () => {
    vi.mocked(commands.pluginAdd).mockResolvedValue("added");

    const { result } = renderHook(() => useAddPlugin());

    await act(async () => {
      await result.current.addPlugin("nodejs");
    });

    expect(commands.pluginAdd).toHaveBeenCalledWith("nodejs", undefined);
  });

  it("adds plugin with name and git URL", async () => {
    vi.mocked(commands.pluginAdd).mockResolvedValue("added");

    const { result } = renderHook(() => useAddPlugin());

    await act(async () => {
      await result.current.addPlugin(
        "custom",
        "https://github.com/example.git",
      );
    });

    expect(commands.pluginAdd).toHaveBeenCalledWith(
      "custom",
      "https://github.com/example.git",
    );
  });

  it("calls onSuccess callback after adding plugin", async () => {
    vi.mocked(commands.pluginAdd).mockResolvedValue("added");
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useAddPlugin({ onSuccess }));

    await act(async () => {
      await result.current.addPlugin("nodejs");
    });

    expect(onSuccess).toHaveBeenCalledWith("nodejs");
  });

  it("calls async onSuccess callback", async () => {
    vi.mocked(commands.pluginAdd).mockResolvedValue("added");
    const onSuccess = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useAddPlugin({ onSuccess }));

    await act(async () => {
      await result.current.addPlugin("python");
    });

    expect(onSuccess).toHaveBeenCalledWith("python");
  });

  it("works without onSuccess option", async () => {
    vi.mocked(commands.pluginAdd).mockResolvedValue("added");

    const { result } = renderHook(() => useAddPlugin());

    // Should not throw even without onSuccess
    await act(async () => {
      await result.current.addPlugin("nodejs");
    });

    expect(commands.pluginAdd).toHaveBeenCalled();
  });

  it("propagates addPlugin error", async () => {
    vi.mocked(commands.pluginAdd).mockRejectedValue(
      new Error("already exists"),
    );

    const { result } = renderHook(() => useAddPlugin());

    await expect(
      act(async () => {
        await result.current.addPlugin("nodejs");
      }),
    ).rejects.toThrow("already exists");
  });

  // ── setShowAddPlugin ───────────────────────────────────────────

  it("can close dialog via setShowAddPlugin", () => {
    const { result } = renderHook(() => useAddPlugin());

    act(() => {
      result.current.setShowAddPlugin(true);
    });
    expect(result.current.showAddPlugin).toBe(true);

    act(() => {
      result.current.setShowAddPlugin(false);
    });
    expect(result.current.showAddPlugin).toBe(false);
  });
});
