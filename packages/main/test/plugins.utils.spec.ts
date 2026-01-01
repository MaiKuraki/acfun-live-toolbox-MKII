import { describe, it, expect } from "vitest";
import { normalizeArrayOfStrings, validatePluginId } from "../../main/src/server/plugins/utils";

describe("plugins utils", () => {
  it("normalizeArrayOfStrings filters and trims", () => {
    const input = [" a ", "", null, "b", 123];
    const out = normalizeArrayOfStrings(input as any);
    expect(out).toEqual(["a", "b", "123"]);
  });

  it("validatePluginId returns null for empty", () => {
    expect(validatePluginId("")).toBeNull();
    expect(validatePluginId("  ")).toBeNull();
    expect(validatePluginId(null)).toBeNull();
  });

  it("validatePluginId returns trimmed id", () => {
    expect(validatePluginId(" abc ")).toBe("abc");
  });
});











