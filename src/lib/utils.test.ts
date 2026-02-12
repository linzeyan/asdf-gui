import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("handles conditional classes", () => {
    const isHidden = false;
    expect(cn("px-2", isHidden && "hidden", "py-1")).toBe("px-2 py-1");
  });

  it("deduplicates conflicting tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
  });

  it("handles undefined and null", () => {
    expect(cn("px-2", undefined, null, "py-1")).toBe("px-2 py-1");
  });

  // ── Additional edge cases ────────────────────────────────────

  it("resolves conflicting margin classes", () => {
    expect(cn("mt-2", "mt-4")).toBe("mt-4");
  });

  it("resolves conflicting text color classes", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("keeps non-conflicting classes", () => {
    expect(cn("px-2", "mt-4", "rounded")).toBe("px-2 mt-4 rounded");
  });

  it("handles arrays via clsx", () => {
    expect(cn(["px-2", "py-1"])).toBe("px-2 py-1");
  });

  it("handles objects via clsx", () => {
    expect(cn({ "px-2": true, hidden: false })).toBe("px-2");
  });

  it("handles multiple false values", () => {
    expect(cn(false, false, false)).toBe("");
  });

  it("handles empty string", () => {
    expect(cn("", "px-2", "")).toBe("px-2");
  });

  it("handles single class", () => {
    expect(cn("px-2")).toBe("px-2");
  });

  it("handles complex tailwind responsive classes", () => {
    expect(cn("md:px-2", "md:px-4")).toBe("md:px-4");
  });

  it("handles dark mode variant classes", () => {
    const result = cn("bg-white", "dark:bg-black");
    expect(result).toContain("bg-white");
    expect(result).toContain("dark:bg-black");
  });

  it("handles hover variant classes", () => {
    const result = cn("hover:bg-blue-500", "hover:bg-red-500");
    expect(result).toBe("hover:bg-red-500");
  });

  it("handles conditional true value", () => {
    const isVisible = true;
    expect(cn("px-2", isVisible && "block")).toBe("px-2 block");
  });
});
