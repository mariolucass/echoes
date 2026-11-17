import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { env } from "../../config/env.js";
import { UnauthorizedError } from "../../errors/AppError.js";
import {
  createMailer,
  type Mailer,
} from "../notification/mailer.service.js";

export const TWO_FACTOR_TTL_SECONDS = 300;
const audience = "echoes-2fa";
const issuer = "echoes";

const secret = () => new TextEncoder().encode(env.JWT_SECRET);
const digest = (userId: string, jti: string, code: string) =>
  createHmac("sha256", env.JWT_SECRET)
    .update(`${userId}:${jti}:${code}`)
    .digest("hex");

/**
 * Stateless e-mail 2FA: the 6-digit code is never stored. The challenge token
 * (short-lived JWT) carries only an HMAC of the code, so it is useless without
 * the code the user received by e-mail.
 */
export class TwoFactorService {
  constructor(private readonly mailer: Mailer = createMailer()) {}

  async issueChallenge(user: { id: string; email: string; name: string }) {
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const jti = randomUUID();
    const challengeToken = await new SignJWT({ ch: digest(user.id, jti, code) })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuer(issuer)
      .setAudience(audience)
      .setJti(jti)
      .setIssuedAt()
      .setExpirationTime(`${TWO_FACTOR_TTL_SECONDS}s`)
      .sign(secret());

    await this.mailer.send(
      user.email,
      "Seu código de verificação Echoes",
      `Olá, ${user.name}.\n\nSeu código de verificação é ${code}. Ele expira em ${TWO_FACTOR_TTL_SECONDS / 60} minutos.\n\nSe não foi você, ignore este e-mail.`,
    );

    return {
      twoFactorRequired: true as const,
      challengeToken,
      expiresInSeconds: TWO_FACTOR_TTL_SECONDS,
    };
  }

  /** Returns the user ID when the code matches; throws 401 otherwise. */
  async verify(challengeToken: string, code: string): Promise<string> {
    let payload;
    try {
      ({ payload } = await jwtVerify(challengeToken, secret(), {
        algorithms: ["HS256"],
        issuer,
        audience,
      }));
    } catch {
      throw new UnauthorizedError("Invalid or expired verification code.");
    }
    const { sub, jti, ch } = payload as {
      sub?: string;
      jti?: string;
      ch?: string;
    };
    if (!sub || !jti || typeof ch !== "string") {
      throw new UnauthorizedError("Invalid or expired verification code.");
    }
    const expected = Buffer.from(ch, "hex");
    const actual = Buffer.from(digest(sub, jti, code), "hex");
    if (
      expected.length !== actual.length ||
      !timingSafeEqual(expected, actual)
    ) {
      throw new UnauthorizedError("Invalid or expired verification code.");
    }
    return sub;
  }
}
