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
import { hashPassword } from "../../utils/password.js";

type PublicUser = NonNullable<Awaited<ReturnType<UserRepository["findById"]>>>;

export class AuthService {
  constructor(
    private readonly repository = new UserRepository(),
    private readonly refreshTokens = new RefreshTokenRepository(),
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

  async login(user: PublicUser) {
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
