import { describe, expect, it } from "vitest";
import { app } from "../../../src/app.js";

describe("CORS headers", () => {
  it("allows the same-server origin", async () => {
    const response = await app.request("http://localhost:3333/health", {
      headers: { Origin: "http://localhost:3333" },
    });
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:3333",
    );
  });

  it("does not grant access to a foreign origin", async () => {
    const response = await app.request("http://localhost:3333/health", {
      headers: { Origin: "https://evil.com" },
    });
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("answers preflight only for the allowed origin", async () => {
    const ok = await app.request("http://localhost:3333/decisions", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3333",
        "Access-Control-Request-Method": "GET",
      },
    });
    expect(ok.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:3333",
    );
    const blocked = await app.request("http://localhost:3333/decisions", {
      method: "OPTIONS",
      headers: {
        Origin: "https://evil.com",
        "Access-Control-Request-Method": "GET",
      },
    });
    expect(blocked.headers.get("access-control-allow-origin")).toBeNull();
  });
});
