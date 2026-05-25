import { describe, expect, it } from "vitest";
import { extractDomain, normalizeUrl } from "../url";

describe("normalizeUrl", () => {
  it("normalizes http and https URLs", () => {
    expect(normalizeUrl(" HTTPS://Example.COM:443/path#section ")).toMatchObject({
      url: "https://example.com/path",
      hostname: "example.com",
      domain: "example.com",
    });
  });

  it("rejects non-http protocols", () => {
    expect(() => normalizeUrl("javascript:alert(1)")).toThrow(/http/);
  });

  it("extracts a basic registrable domain", () => {
    expect(extractDomain("login.mail.google.com")).toBe("google.com");
  });

  it("handles common multi-part suffixes", () => {
    expect(extractDomain("secure.example.co.uk")).toBe("example.co.uk");
  });
});
