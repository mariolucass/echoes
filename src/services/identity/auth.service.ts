import { rethrowRegistrationError, tokenExpiry } from "../../middlewares/auth/index.js";
import { UserRepository } from "../../repositories/identity/index.js";
import { RefreshTokenRepository } from "../../repositories/identity/index.js";
import type { z } from "@hono/zod-openapi";
import type { registerSchema } from "../../schemas/identity/index.js";
import {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
} from "../../utils/jwt.js";
import { env } from "../../config/env.js";
import { DemoAccountService } from "./demo-account.service.js";
import { TwoFactorService } from "./two-factor.service.js";
import { NotFoundError, UnauthorizedError } from "../../errors/AppError.js";
import { hashPassword } from "../../utils/password.js";

type PublicUser = NonNullable<Awaited<ReturnType<UserRepository["findById"]>>>;

export class AuthService {
  constructor(
    private readonly repository = new UserRepository(),
    private readonly refreshTokens = new RefreshTokenRepository(),
    private readonly twoFactor = new TwoFactorService(),
    private readonly demoAccount = new DemoAccountService(),
  ) {}

  async register(input: z.infer<typeof registerSchema>) {
    const passwordHash = await hashPassword(input.password);
    let user: PublicUser;
    try {
      user = await this.repository.create({
        name: input.name,
        email: input.email,
        passwordHash,
      });
    } catch (error) {
      rethrowRegistrationError(error);
    }
    return this.withToken(user);
  }

  /** With 2FA enabled, returns a challenge instead of a session. */
  async login(user: PublicUser) {
    const isDemoUser =
      env.DEMO_USER_EMAIL !== undefined &&
      user.email.toLowerCase() === env.DEMO_USER_EMAIL.toLowerCase();
    if (env.TWO_FACTOR_ENABLED && !isDemoUser) {
      return this.twoFactor.issueChallenge(user);
    }
    return this.withToken(user);
  }

  /** Sessão da conta demo pública; cria a conta e os dados de exemplo se ainda não existirem. */
  async demoSession() {
    if (!this.demoAccount.enabled) throw new NotFoundError("Demo account is not enabled.");
    const { user } = await this.demoAccount.ensure();
    if (!user) throw new NotFoundError("Demo account is not enabled.");
    return this.withToken(user);
  }

  async verifyTwoFactor(challengeToken: string, code: string) {
    const userId = await this.twoFactor.verify(challengeToken, code);
    const user = await this.repository.findById(userId);
    if (!user) throw new UnauthorizedError("Invalid or expired verification code.");
    return this.withToken(user);
  }

  async refresh(user: PublicUser, oldRefreshToken: string) {
    const refreshToken = await signRefreshToken(user.id);
    const refreshTokenExpiresAt = tokenExpiry(refreshToken);
    await this.refreshTokens.rotate(
      user.id,
      hashRefreshToken(oldRefreshToken),
      hashRefreshToken(refreshToken),
      refreshTokenExpiresAt,
    );

    return {
      user,
      session: await this.session(user.id, refreshToken, refreshTokenExpiresAt),
    };
  }

  private async withToken(user: Awaited<ReturnType<UserRepository["create"]>>) {
    const refreshToken = await signRefreshToken(user.id);
    const refreshTokenExpiresAt = tokenExpiry(refreshToken);
    await this.refreshTokens.create(
      user.id,
      hashRefreshToken(refreshToken),
      refreshTokenExpiresAt,
    );
    return {
      user,
      session: await this.session(user.id, refreshToken, refreshTokenExpiresAt),
    };
  }

  private async session(
    userId: string,
    refreshToken: string,
    refreshTokenExpiresAt: Date,
  ) {
    const accessToken = await signAccessToken(userId);
    return {
      accessToken,
      refreshToken,
      tokenType: "Bearer" as const,
      accessTokenExpiresAt: tokenExpiry(accessToken).toISOString(),
      refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
    };
  }
}
