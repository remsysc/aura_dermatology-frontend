import { describe, expect, it } from "vitest";
import { normalizePhMobile, isValidPhMobile } from "./phone";

describe("normalizePhMobile", () => {
  it.each([
    ["0917 123 4567", "+639171234567"],
    ["09171234567", "+639171234567"],
    ["917-123-4567", "+639171234567"],
    ["+63 917 123 4567", "+639171234567"],
    ["639171234567", "+639171234567"],
    ["(0917) 123.4567", "+639171234567"],
  ])("accepts %s", (input, expected) => {
    expect(normalizePhMobile(input)).toBe(expected);
  });

  it.each([
    "",
    "12345",
    "0817 123 4567", // not a 9xx mobile prefix
    "+1 415 555 0100",
    "0917 123 456", // too short
    "0917 123 45678", // too long
    "abc",
  ])("rejects %j", (input) => {
    expect(normalizePhMobile(input)).toBeNull();
  });

  it("always produces something the API regex accepts", () => {
    expect(normalizePhMobile("0917 123 4567")).toMatch(/^\+639\d{9}$/);
  });

  it("validates mobile numbers correctly via isValidPhMobile", () => {
    expect(isValidPhMobile("0917 123 4567")).toBe(true);
    expect(isValidPhMobile("+639171234567")).toBe(true);
    expect(isValidPhMobile("12345")).toBe(false);
  });
});
