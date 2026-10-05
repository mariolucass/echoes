import prisma from "../../../src/database/prisma.js";
import { assertTestDatabaseUrl } from "./test-database-url.js";

export async function resetTestData(): Promise<void> {
  assertTestDatabaseUrl();
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');
}
