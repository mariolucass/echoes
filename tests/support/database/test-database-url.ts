export function assertTestDatabaseUrl(): string {
  const testUrl = process.env.ECHOES_TEST_DATABASE_URL;
  const activeUrl = process.env.DATABASE_URL;

  if (!testUrl || !activeUrl || activeUrl !== testUrl) {
    throw new Error(
      "Set ECHOES_TEST_DATABASE_URL and use the same URL as DATABASE_URL for database tests.",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(testUrl);
  } catch {
    throw new Error("ECHOES_TEST_DATABASE_URL must be a valid PostgreSQL URL.");
  }

  if (
    !["postgres:", "postgresql:"].includes(parsed.protocol) ||
    !parsed.pathname.endsWith("_test")
  ) {
    throw new Error(
      "Database tests require a PostgreSQL database whose name ends in _test.",
    );
  }

  if (process.env.NODE_ENV !== "test") {
    throw new Error("Database tests require NODE_ENV=test.");
  }

  return testUrl;
}
