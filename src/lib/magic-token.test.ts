import { beforeEach, describe, expect, it } from "vitest";
import { clearToken, consumeToken, parseFragmentToken, toInternalLink } from "./magic-token";

describe("parseFragmentToken", () => {
  it("reads the t parameter", () => {
    expect(parseFragmentToken("#t=abc123")).toBe("abc123");
  });

  it("ignores other parameters and empty values", () => {
    expect(parseFragmentToken("#x=1&t=tok")).toBe("tok");
    expect(parseFragmentToken("#t=")).toBeNull();
    expect(parseFragmentToken("")).toBeNull();
  });
});

describe("consumeToken", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/manage");
  });

  it("persists the fragment token and strips it from the address bar", () => {
    window.history.replaceState(null, "", "/manage?x=1#t=secret-token");

    expect(consumeToken("manage")).toBe("secret-token");
    expect(window.location.hash).toBe("");
    expect(window.location.search).toBe("?x=1");
  });

  it("falls back to the tab's session storage after the fragment is gone", () => {
    window.history.replaceState(null, "", "/manage#t=secret-token");
    consumeToken("manage");

    expect(consumeToken("manage")).toBe("secret-token");
  });

  it("keeps tokens for different purposes separate", () => {
    window.history.replaceState(null, "", "/manage#t=manage-token");
    consumeToken("manage");

    expect(consumeToken("intake")).toBeNull();
  });

  it("forgets a cleared token", () => {
    window.history.replaceState(null, "", "/manage#t=secret-token");
    consumeToken("manage");
    clearToken("manage");

    expect(consumeToken("manage")).toBeNull();
  });
});

describe("toInternalLink", () => {
  const allowed = ["/manage", "/intake"] as const;

  it("rewrites API-origin magic links onto this app's path", () => {
    expect(toInternalLink("http://localhost:8000/manage#t=abc", allowed)).toBe("/manage#t=abc");
  });

  it("rejects paths outside the allowlist and malformed URLs", () => {
    expect(toInternalLink("https://evil.example/admin#t=abc", allowed)).toBeNull();
    expect(toInternalLink("not a url", allowed)).toBeNull();
  });
});
