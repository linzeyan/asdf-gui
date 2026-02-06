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
