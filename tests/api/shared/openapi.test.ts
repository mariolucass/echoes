import { describe, expect, it } from "vitest";
import { app } from "../../../src/app.js";
import { sortOperationsByCrud } from "../../../src/bootstrap/openapi.js";

describe("OpenAPI document", () => {
  it("configures the reference to show create, read, update, then delete", async () => {
    const operations = ["delete", "patch", "get", "post", "put"]
      .map((method) => ({ method, path: "/example" }))
      .sort(sortOperationsByCrud);
    expect(operations.map(({ method }) => method)).toEqual([
      "post",
      "get",
      "patch",
      "put",
      "delete",
    ]);

    const response = await app.request("/reference");
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("operationsSorter");
  });

  it("includes every registered API route with valid parameter paths", async () => {
    const response = await app.request("/doc");
    expect(response.status).toBe(200);

    const document = (await response.json()) as {
      openapi: string;
      paths: Record<string, Record<string, unknown>>;
    };
    expect(document.openapi).toBe("3.1.0");
    expect(document.paths).toMatchObject({
      "/health": { get: expect.any(Object) },
      "/request-logs": { get: expect.any(Object) },
      "/identity/auth/register": { post: expect.any(Object) },
      "/identity/users/me": { patch: expect.any(Object) },
      "/decisions": { get: expect.any(Object), post: expect.any(Object) },
      "/decisions/{id}/report.pdf": { get: expect.any(Object) },
      "/decisions/{id}/alternatives": {
        get: expect.any(Object),
        post: expect.any(Object),
      },
      "/decisions/{id}/alternatives/{alternativeId}": {
        get: expect.any(Object),
        delete: expect.any(Object),
      },
      "/decisions/{id}/commit": { post: expect.any(Object) },
      "/decisions/{id}/expectations": { post: expect.any(Object) },
      "/decisions/{id}/reviews": { post: expect.any(Object) },
      "/decisions/{id}/tags/{tagId}": {
        put: expect.any(Object),
        delete: expect.any(Object),
      },
      "/tracking/checkpoints": {
        get: expect.any(Object),
        post: expect.any(Object),
      },
      "/tracking/metrics/{id}/measurements": {
        get: expect.any(Object),
        post: expect.any(Object),
      },
      "/learning/outcomes/{id}/assessments": { get: expect.any(Object) },
      "/learning/reflections": { get: expect.any(Object) },
      "/export/csv": { get: expect.any(Object) },
      "/identity/auth/verify-2fa": { post: expect.any(Object) },
      "/identity/users/me/avatar": { put: expect.any(Object) },
      "/classification/tags": {
        get: expect.any(Object),
        post: expect.any(Object),
      },
      "/system/integrations": { get: expect.any(Object) },
      "/system/integrations/roundtrip": { post: expect.any(Object) },
    });
    expect(Object.keys(document.paths)).toHaveLength(37);
    expect(
      Object.values(document.paths).reduce(
        (count, path) => count + Object.keys(path).length,
        0,
      ),
    ).toBe(48);
    expect(
      Object.keys(document.paths).every((path) => !path.includes(":")),
    ).toBe(true);
  });
});
