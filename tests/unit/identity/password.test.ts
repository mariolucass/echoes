import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../../../src/utils/password.js";

describe("password hashing (scrypt + salt)", () => {
  it("never stores the plain text password", async () => {
    const hash = await hashPassword("Senha@123");
    expect(hash).not.toContain("Senha@123");
    expect(hash).toMatch(/^scrypt:\d+:\d+:\d+:[0-9a-f]{32}:[0-9a-f]{128}$/);
  });

  it("uses a random salt: same password yields different hashes", async () => {
    expect(await hashPassword("Senha@123")).not.toBe(
      await hashPassword("Senha@123"),
    );
  });

  it("verifies the correct password and rejects a wrong one", async () => {
    const hash = await hashPassword("Senha@123");
    expect(await verifyPassword("Senha@123", hash)).toBe(true);
    expect(await verifyPassword("senha@123", hash)).toBe(false);
  });

  it("rejects malformed stored hashes and invalid lengths", async () => {
    expect(await verifyPassword("x", "texto-puro")).toBe(false);
    expect(await verifyPassword("x", "bcrypt:1:2:3:aa:bb")).toBe(false);
    expect(await verifyPassword("", await hashPassword("a"))).toBe(false);
    expect(await verifyPassword("a".repeat(129), await hashPassword("a"))).toBe(
      false,
    );
  });

  it("refuses to hash empty or oversized passwords", async () => {
    await expect(hashPassword("")).rejects.toThrow();
    await expect(hashPassword("a".repeat(129))).rejects.toThrow();
  });
});
