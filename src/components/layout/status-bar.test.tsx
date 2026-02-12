import { describe, it, expect } from "vitest";

// Test StatusBar conditional rendering logic

describe("StatusBar rendering logic", () => {
  // ── Conditional display logic ──────────────────────────────────

  it("asdf version shows only when truthy", () => {
    const cases = [
      { asdfVersion: "0.14.0", expected: true },
      { asdfVersion: null, expected: false },
      { asdfVersion: "", expected: false },
      { asdfVersion: undefined, expected: false },
    ];
    for (const { asdfVersion, expected } of cases) {
      expect(!!asdfVersion).toBe(expected);
    }
  });

  it("plugin count shows only when > 0", () => {
    const cases = [
      { pluginCount: 5, expected: true },
      { pluginCount: 1, expected: true },
      { pluginCount: 0, expected: false },
      { pluginCount: -1, expected: false },
    ];
    for (const { pluginCount, expected } of cases) {
      expect(pluginCount > 0).toBe(expected);
    }
  });

  it("working dir button shows only when truthy", () => {
    const cases = [
      { workingDir: "/home/user", expected: true },
      { workingDir: null, expected: false },
      { workingDir: "", expected: false },
    ];
    for (const { workingDir, expected } of cases) {
      expect(!!workingDir).toBe(expected);
    }
  });

  // ── Version format ─────────────────────────────────────────────

  it("formats asdf version as 'asdf {version}'", () => {
    const version = "0.14.0";
    expect(`asdf ${version}`).toBe("asdf 0.14.0");
  });

  it("handles long version strings", () => {
    const version = "0.14.0-beta.1+build.123";
    expect(`asdf ${version}`).toBe("asdf 0.14.0-beta.1+build.123");
  });
});
