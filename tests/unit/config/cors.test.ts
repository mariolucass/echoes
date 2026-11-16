import { describe, expect, it } from "vitest";
import { resolveCorsOrigin } from "../../../src/config/cors.js";

describe("CORS (same server only)", () => {
  it("allows the server's own origin", () => {
    expect(
      resolveCorsOrigin("https://api.exemplo.com", "https://api.exemplo.com/x"),
    ).toBe("https://api.exemplo.com");
    expect(
      resolveCorsOrigin("http://localhost:3333", "http://localhost:3333/health"),
    ).toBe("http://localhost:3333");
  });

  it("blocks any other origin", () => {
    expect(
      resolveCorsOrigin("https://evil.com", "https://api.exemplo.com/x"),
    ).toBeUndefined();
    expect(
      resolveCorsOrigin("http://localhost:9999", "http://localhost:3333/x"),
    ).toBeUndefined();
  });

  it("ignores requests without Origin", () => {
    expect(resolveCorsOrigin(undefined, "http://localhost:3333/x")).toBeUndefined();
  });
});
