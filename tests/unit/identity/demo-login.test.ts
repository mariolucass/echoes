import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../../../src/config/env.js";
import { AuthService } from "../../../src/services/identity/auth.service.js";

const user = { id: "u1", name: "Demo", email: "Demo@Echoes.app", avatarUrl: null, createdAt: new Date() };

function setup() {
  const issueChallenge = vi.fn().mockResolvedValue({ twoFactorRequired: true });
  const create = vi.fn().mockResolvedValue(undefined);
  const service = new AuthService(
    {} as never,
    { create } as never,
    { issueChallenge } as never,
  );
  return { service, issueChallenge };
}

describe("AuthService.login com conta demo", () => {
  const original = { ...env };
  afterEach(() => Object.assign(env, original));

  it("pula o 2FA apenas para o e-mail da conta demo", async () => {
    Object.assign(env, { TWO_FACTOR_ENABLED: true, DEMO_USER_EMAIL: "demo@echoes.app" });
    const { service, issueChallenge } = setup();

    const demo = await service.login(user as never);
    expect(demo).toHaveProperty("session.accessToken");
    expect(issueChallenge).not.toHaveBeenCalled();

    await service.login({ ...user, email: "outra@pessoa.com" } as never);
    expect(issueChallenge).toHaveBeenCalledTimes(1);
  });

  it("mantém o 2FA para todos quando DEMO_USER_EMAIL não está definido", async () => {
    Object.assign(env, { TWO_FACTOR_ENABLED: true, DEMO_USER_EMAIL: undefined });
    const { service, issueChallenge } = setup();
    await service.login(user as never);
    expect(issueChallenge).toHaveBeenCalledTimes(1);
  });
});
