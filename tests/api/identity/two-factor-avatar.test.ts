import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "../../../src/app.js";
import { env } from "../../../src/config/env.js";
import { UserRepository } from "../../../src/repositories/identity/index.js";
import { RefreshTokenRepository } from "../../../src/repositories/identity/index.js";
import { signAccessToken } from "../../../src/utils/jwt.js";
import { hashPassword } from "../../../src/utils/password.js";

vi.mock("../../../src/database/prisma.js", () => ({
  default: { requestLog: { create: vi.fn().mockResolvedValue(undefined) } },
}));

const user = {
  id: "c3cf2108-8bd0-46a1-a24c-4d3af0db3910",
  name: "Lucas",
  email: "lucas@example.com",
  avatarUrl: null,
  createdAt: new Date("2026-09-25T12:00:00.000Z"),
};
const json = (body: unknown) => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

afterEach(() => {
  vi.restoreAllMocks();
  env.TWO_FACTOR_ENABLED = false;
});

describe("login with 2FA", () => {
  it("returns a challenge instead of tokens, then issues the session after the code", async () => {
    env.TWO_FACTOR_ENABLED = true;
    const passwordHash = await hashPassword("Senha@123");
    vi.spyOn(UserRepository.prototype, "findByEmail").mockResolvedValue({ ...user, passwordHash });
    vi.spyOn(UserRepository.prototype, "findById").mockResolvedValue(user);
    vi.spyOn(RefreshTokenRepository.prototype, "create").mockResolvedValue(undefined as never);
    let sentCode = "";
    const mail = vi
      .spyOn(await import("../../../src/services/notification/mailer.service.js").then((m) => m.ConsoleMailer.prototype), "send")
      .mockImplementation(async (_to, _s, text) => {
        sentCode = /(\d{6})\./.exec(text)![1]!;
      });

    const login = await app.request("/identity/auth/login", json({ email: user.email, password: "Senha@123" }));
    expect(login.status).toBe(200);
    const challenge = (await login.json()) as { twoFactorRequired: boolean; challengeToken: string; session?: unknown };
    expect(challenge.twoFactorRequired).toBe(true);
    expect(challenge.session).toBeUndefined();
    expect(mail).toHaveBeenCalledOnce();

    const bad = await app.request("/identity/auth/verify-2fa", json({ challengeToken: challenge.challengeToken, code: sentCode === "000000" ? "111111" : "000000" }));
    expect(bad.status).toBe(401);

    const ok = await app.request("/identity/auth/verify-2fa", json({ challengeToken: challenge.challengeToken, code: sentCode }));
    expect(ok.status).toBe(200);
    expect(((await ok.json()) as { session: { accessToken: string } }).session.accessToken).toEqual(expect.any(String));
  });

  it("validates the verify-2fa body", async () => {
    const response = await app.request("/identity/auth/verify-2fa", json({ challengeToken: "x", code: "12" }));
    expect(response.status).toBe(422);
  });
});

describe("PUT /identity/users/me/avatar", () => {
  const put = async (form: FormData | undefined, token?: string) =>
    app.request("/identity/users/me/avatar", {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

  it("requires authentication", async () => {
    expect((await put(undefined)).status).toBe(401);
  });

  it("rejects missing file and non-image types", async () => {
    const token = await signAccessToken(user.id);
    expect((await put(new FormData(), token)).status).toBe(422);
    const form = new FormData();
    form.set("file", new File(["x"], "a.txt", { type: "text/plain" }));
    expect((await put(form, token)).status).toBe(422);
  });
});
