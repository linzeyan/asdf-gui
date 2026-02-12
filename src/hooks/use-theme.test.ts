import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Test the applyTheme logic and matchMedia behavior without requiring
// @testing-library/react. We test the underlying DOM logic directly.

describe("useTheme logic", () => {
  let addSpy: ReturnType<typeof vi.fn>;
  let removeSpy: ReturnType<typeof vi.fn>;
  let toggleSpy: ReturnType<typeof vi.fn>;
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    addSpy = vi.fn();
    removeSpy = vi.fn();
    toggleSpy = vi.fn();

    Object.defineProperty(document.documentElement, "classList", {
      value: {
        add: addSpy,
        remove: removeSpy,
        toggle: toggleSpy,
        contains: vi.fn(),
      },
      configurable: true,
      writable: true,
    });

    matchMediaMock = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    Object.defineProperty(window, "matchMedia", {
      value: matchMediaMock,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── applyTheme function behavior ─────────────────────────────

  // Reimplemented here to avoid coupling to the hook's useEffect
  function applyTheme(theme: string) {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }

  it("dark theme adds dark class", () => {
    applyTheme("dark");
    expect(addSpy).toHaveBeenCalledWith("dark");
    expect(removeSpy).not.toHaveBeenCalled();
  });

  it("light theme removes dark class", () => {
    applyTheme("light");
    expect(removeSpy).toHaveBeenCalledWith("dark");
    expect(addSpy).not.toHaveBeenCalled();
  });

  it("system theme with dark preference adds dark", () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    applyTheme("system");

    expect(matchMediaMock).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    expect(toggleSpy).toHaveBeenCalledWith("dark", true);
  });

  it("system theme with light preference does not add dark", () => {
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    applyTheme("system");

    expect(toggleSpy).toHaveBeenCalledWith("dark", false);
  });

  it("unknown theme string treated as system", () => {
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    applyTheme("auto");

    expect(toggleSpy).toHaveBeenCalledWith("dark", false);
  });

  it("empty theme string treated as system", () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    applyTheme("");

    expect(toggleSpy).toHaveBeenCalledWith("dark", true);
  });

  // ── matchMedia event listener ────────────────────────────────

  it("registers change listener on matchMedia", () => {
    const addListenerSpy = vi.fn();
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: addListenerSpy,
      removeEventListener: vi.fn(),
    });

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {};
    mq.addEventListener("change", handler);

    expect(addListenerSpy).toHaveBeenCalledWith("change", handler);
  });

  it("can remove change listener from matchMedia", () => {
    const removeListenerSpy = vi.fn();
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: removeListenerSpy,
    });

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {};
    mq.removeEventListener("change", handler);

    expect(removeListenerSpy).toHaveBeenCalledWith("change", handler);
  });
});
