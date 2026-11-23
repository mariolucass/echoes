import type { Context } from "hono";
import { IntegrationsService } from "../../services/system/index.js";

const service = new IntegrationsService();

export async function getIntegrations(c: Context) {
  c.header("Cache-Control", "no-store");
  const services = await service.check();
  return c.json({ checkedAt: new Date().toISOString(), services }, 200);
}

export async function runIntegrationsRoundtrip(c: Context) {
  c.header("Cache-Control", "no-store");
  const result = await service.roundtrip();
  return c.json({ checkedAt: new Date().toISOString(), ...result }, 200);
}
