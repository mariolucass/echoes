import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const schemaDir = join(root, "prisma");
const outputDir = join(root, "src", "generated", "prisma");
const markerPath = join(outputDir, ".generation-checksum.json");

async function schemaFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return schemaFiles(path);
      return entry.isFile() && entry.name.endsWith(".prisma") ? [path] : [];
    }),
  );
  return files.flat();
}

async function fingerprint() {
  const candidateInputs = [
    join(root, "package.json"),
    join(root, "pnpm-lock.yaml"),
    join(root, "prisma.config.ts"),
    ...(await schemaFiles(schemaDir)),
  ];
  const inputs = candidateInputs.filter(existsSync).sort();

  const hash = createHash("sha256");
  for (const path of inputs) {
    hash.update(relative(root, path));
    hash.update("\0");
    hash.update(await readFile(path));
    hash.update("\0");
  }
  return hash.digest("hex");
}

async function generatedFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return generatedFiles(path);
      return entry.isFile() && path !== markerPath
        ? [relative(outputDir, path)]
        : [];
    }),
  );
  return files.flat().sort();
}

const currentFingerprint = await fingerprint();
let previous;
try {
  previous = JSON.parse(await readFile(markerPath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
}

if (
  !process.argv.includes("--force") &&
  previous?.fingerprint === currentFingerprint &&
  previous.files?.length > 0 &&
  previous.files.every((file) => existsSync(join(outputDir, file)))
) {
  console.log("Prisma Client já está atualizado.");
  process.exit(0);
}

console.log("Gerando Prisma Client...");

const exitCode = await new Promise((settle, reject) => {
  const child = spawn("pnpm", ["exec", "prisma", "generate"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });
  child.on("error", reject);
  child.on("exit", (code) => settle(code));
});
if (exitCode !== 0) process.exit(exitCode ?? 1);

const files = await generatedFiles(outputDir);
if (!files.includes("client.ts")) {
  throw new Error(
    "Prisma Client não foi gerado em src/generated/prisma/client.ts",
  );
}
await writeFile(
  markerPath,
  JSON.stringify({ fingerprint: currentFingerprint, files }),
);
