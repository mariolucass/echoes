import "dotenv/config";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const testUrl = process.env.ECHOES_TEST_DATABASE_URL;
let parsed;
try {
  parsed = new URL(testUrl);
} catch {
  throw new Error(
    "Set ECHOES_TEST_DATABASE_URL to a dedicated PostgreSQL test database.",
  );
}

if (
  !["postgres:", "postgresql:"].includes(parsed.protocol) ||
  !parsed.pathname.endsWith("_test")
) {
  throw new Error(
    "ECHOES_TEST_DATABASE_URL must point to a PostgreSQL database named *_test.",
  );
}

const env = {
  ...process.env,
  NODE_ENV: "test",
  DATABASE_URL: testUrl,
  JWT_SECRET: "test-secret-that-is-at-least-32-bytes-long",
};
const targets = process.argv.slice(2);
if (targets.some((target) => !["integration", "e2e"].includes(target))) {
  throw new Error("Use integration or e2e as the test project name.");
}

function run(entry, args) {
  const result = spawnSync(process.execPath, [resolve(entry), ...args], {
    env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("scripts/ensure-prisma-client.mjs", []);
run("node_modules/prisma/build/index.js", ["migrate", "deploy"]);
for (const target of targets.length ? targets : ["integration", "e2e"]) {
  run("node_modules/vitest/vitest.mjs", ["run", "--project", target]);
}
