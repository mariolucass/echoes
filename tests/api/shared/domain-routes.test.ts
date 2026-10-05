import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/app.js";
import { env } from "../../../src/config/env.js";
import { signAccessToken } from "../../../src/utils/jwt.js";

const originalSecret = env.JWT_SECRET;
beforeAll(() => {
  env.JWT_SECRET = "test-secret-that-is-at-least-32-bytes-long";
});
afterAll(() => {
  env.JWT_SECRET = originalSecret;
});

describe("domain routes", () => {
  it.each([
    ["GET", "/tracking/checkpoints?decisionId=invalid"],
    ["GET", "/tracking/metrics?decisionId=invalid"],
    ["GET", "/learning/outcomes?decisionId=invalid"],
    ["GET", "/learning/reflections?decisionId=invalid"],
    ["GET", "/classification/tags"],
    ["GET", "/decisions/invalid/tags"],
    ["PATCH", "/identity/users/me"],
  ])("protects %s %s", async (method, path) => {
    const response = await app.request(path, { method });
    expect(response.status).toBe(401);
  });

  it.each([
    ["/tracking/checkpoints?decisionId=invalid"],
    ["/tracking/metrics?decisionId=invalid"],
    ["/learning/outcomes?decisionId=invalid"],
    ["/learning/reflections?decisionId=invalid"],
    ["/decisions/invalid/tags"],
  ])("rejects invalid identifiers at %s", async (path) => {
    const token = await signAccessToken("11111111-1111-4111-8111-111111111111");
    const response = await app.request(path, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(422);
  });

  it("validates both IDs in a tag link", async () => {
    const token = await signAccessToken("11111111-1111-4111-8111-111111111111");
    const response = await app.request("/decisions/invalid/tags/invalid", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(422);
  });
});
