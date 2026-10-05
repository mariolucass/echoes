import { afterEach, describe, expect, it } from "vitest";
import { assertTestDatabaseUrl } from "../../support/database/test-database-url.js";

const original = {
  testUrl: process.env.ECHOES_TEST_DATABASE_URL,
  databaseUrl: process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV,
};

afterEach(() => {
  for (const [name, value] of Object.entries({
    ECHOES_TEST_DATABASE_URL: original.testUrl,
    DATABASE_URL: original.databaseUrl,
    NODE_ENV: original.nodeEnv,
  })) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe("test database guard", () => {
  it("rejects missing, mismatched, and non-test database URLs", () => {
    process.env.NODE_ENV = "test";
    process.env.ECHOES_TEST_DATABASE_URL = "postgresql://localhost/echoes_test";
    process.env.DATABASE_URL = "postgresql://localhost/echoes";
    expect(assertTestDatabaseUrl).toThrow(/same URL/);

    process.env.DATABASE_URL = "postgresql://localhost/echoes";
    process.env.ECHOES_TEST_DATABASE_URL = "postgresql://localhost/echoes";
    expect(assertTestDatabaseUrl).toThrow(/ends in _test/);
  });

  it("accepts only an explicit test URL in test mode", () => {
    const url = "postgresql://localhost:5433/echoes_test";
    process.env.ECHOES_TEST_DATABASE_URL = url;
    process.env.DATABASE_URL = url;
    process.env.NODE_ENV = "development";
    expect(assertTestDatabaseUrl).toThrow(/NODE_ENV=test/);

    process.env.NODE_ENV = "test";
    expect(assertTestDatabaseUrl()).toBe(url);
  });
});
