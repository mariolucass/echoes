import { z } from "@hono/zod-openapi";

const service = z.enum(["postgres", "mongodb", "cloudinary"]);

export const integrationCheckSchema = z.object({
  id: service,
  name: z.string(),
  role: z.string(),
  status: z.enum(["up", "down", "unconfigured"]),
  latencyMs: z.number().int().nullable(),
  details: z.array(z.object({ label: z.string(), value: z.string() })),
  error: z.string().nullable(),
});

export const integrationsResponse = z.object({
  checkedAt: z.iso.datetime(),
  services: z.array(integrationCheckSchema),
});

export const roundtripResponse = z.object({
  checkedAt: z.iso.datetime(),
  ok: z.boolean(),
  steps: z.array(z.object({
    service,
    step: z.string(),
    ok: z.boolean(),
    ms: z.number().int(),
    detail: z.string().nullable(),
  })),
});
