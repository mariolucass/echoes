import { describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "../../../src/errors/AppError.js";
import { TwoFactorService } from "../../../src/services/identity/two-factor.service.js";

const user = { id: "u1", email: "a@b.com", name: "Ada" };

function setup() {
  const send = vi.fn().mockResolvedValue(undefined);
  const service = new TwoFactorService({ send });
  const codeFrom = () => /é (\d{6})\./.exec(send.mock.calls[0]![2])![1]!;
  return { send, service, codeFrom };
}

describe("TwoFactorService", () => {
  it("emails a 6-digit code and returns a challenge without the code", async () => {
    const { send, service, codeFrom } = setup();
    const challenge = await service.issueChallenge(user);
    expect(send).toHaveBeenCalledWith(user.email, expect.any(String), expect.any(String));
    expect(codeFrom()).toMatch(/^\d{6}$/);
    expect(challenge.twoFactorRequired).toBe(true);
    expect(JSON.stringify(challenge)).not.toContain(codeFrom());
  });

  it("accepts the right code and returns the user id", async () => {
    const { service, codeFrom } = setup();
    const { challengeToken } = await service.issueChallenge(user);
    expect(await service.verify(challengeToken, codeFrom())).toBe("u1");
  });

  it("rejects a wrong code, a garbage token and a different challenge", async () => {
    const { service, codeFrom } = setup();
    const { challengeToken } = await service.issueChallenge(user);
    const wrong = codeFrom() === "000000" ? "111111" : "000000";
    await expect(service.verify(challengeToken, wrong)).rejects.toThrow(UnauthorizedError);
    await expect(service.verify("garbage", codeFrom())).rejects.toThrow(UnauthorizedError);
  });

  it("rejects an expired challenge", async () => {
    vi.useFakeTimers();
    try {
      const { service, codeFrom } = setup();
      const { challengeToken } = await service.issueChallenge(user);
      vi.advanceTimersByTime(301_000);
      await expect(service.verify(challengeToken, codeFrom())).rejects.toThrow(UnauthorizedError);
    } finally {
      vi.useRealTimers();
    }
  });
});
