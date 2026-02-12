import { describe, it, expect } from "vitest";
import en from "@/locales/en/translation.json";
import zhTW from "@/locales/zh-TW/translation.json";

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      return flattenKeys(value as Record<string, unknown>, fullKey);
    }
    return [fullKey];
  });
}

describe("i18n", () => {
  const enKeys = flattenKeys(en);
  const zhKeys = flattenKeys(zhTW);

  it("has matching keys between en and zh-TW", () => {
    const missingInZh = enKeys.filter((k) => !zhKeys.includes(k));
    const missingInEn = zhKeys.filter((k) => !enKeys.includes(k));

    expect(missingInZh, `Missing in zh-TW: ${missingInZh.join(", ")}`).toEqual(
      [],
    );
    expect(missingInEn, `Missing in en: ${missingInEn.join(", ")}`).toEqual([]);
  });

  it("has no empty translation values in en", () => {
    const enValues = flattenValues(en);
    const empty = enValues.filter(([, v]) => v === "");
    expect(empty, `Empty values: ${empty.map(([k]) => k).join(", ")}`).toEqual(
      [],
    );
  });

  it("has no empty translation values in zh-TW", () => {
    const zhValues = flattenValues(zhTW);
    const empty = zhValues.filter(([, v]) => v === "");
    expect(empty, `Empty values: ${empty.map(([k]) => k).join(", ")}`).toEqual(
      [],
    );
  });

  // ── Additional i18n tests ──────────────────────────────────────

  it("has at least one translation key", () => {
    expect(enKeys.length).toBeGreaterThan(0);
    expect(zhKeys.length).toBeGreaterThan(0);
  });

  it("en and zh-TW have the same number of keys", () => {
    expect(enKeys.length).toBe(zhKeys.length);
  });

  it("all en values are strings", () => {
    const enValues = flattenValues(en);
    for (const [key, value] of enValues) {
      expect(typeof value, `Key ${key} should be string`).toBe("string");
    }
  });

  it("all zh-TW values are strings", () => {
    const zhValues = flattenValues(zhTW);
    for (const [key, value] of zhValues) {
      expect(typeof value, `Key ${key} should be string`).toBe("string");
    }
  });

  it("en values do not contain raw HTML tags (security)", () => {
    const enValues = flattenValues(en);
    const htmlPattern = /<script|<iframe|onclick|onerror/i;
    for (const [key, value] of enValues) {
      expect(
        htmlPattern.test(value),
        `Key ${key} contains potentially dangerous HTML`,
      ).toBe(false);
    }
  });

  it("zh-TW values do not contain raw HTML tags (security)", () => {
    const zhValues = flattenValues(zhTW);
    const htmlPattern = /<script|<iframe|onclick|onerror/i;
    for (const [key, value] of zhValues) {
      expect(
        htmlPattern.test(value),
        `Key ${key} contains potentially dangerous HTML`,
      ).toBe(false);
    }
  });

  it("sidebar keys exist in both languages", () => {
    const sidebarKeys = enKeys.filter((k) => k.startsWith("sidebar."));
    expect(sidebarKeys.length).toBeGreaterThan(0);
    for (const key of sidebarKeys) {
      expect(zhKeys, `sidebar key ${key} missing in zh-TW`).toContain(key);
    }
  });

  it("error keys exist in both languages", () => {
    const errorKeys = enKeys.filter((k) => k.startsWith("errors."));
    expect(errorKeys.length).toBeGreaterThan(0);
    for (const key of errorKeys) {
      expect(zhKeys, `error key ${key} missing in zh-TW`).toContain(key);
    }
  });

  it("no translation value has only whitespace", () => {
    const enValues = flattenValues(en);
    const whitespaceOnly = enValues.filter(
      ([, v]) => v.length > 0 && v.trim() === "",
    );
    expect(
      whitespaceOnly,
      `Whitespace-only values: ${whitespaceOnly.map(([k]) => k).join(", ")}`,
    ).toEqual([]);
  });
});

function flattenValues(
  obj: Record<string, unknown>,
  prefix = "",
): [string, string][] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      return flattenValues(value as Record<string, unknown>, fullKey);
    }
    return [[fullKey, String(value)]] as [string, string][];
  });
}
