import prisma from "../../database/prisma.js";
import { requireConsumedRefreshToken } from "../../middlewares/auth/index.js";

export class RefreshTokenRepository {
  create(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async rotate(
    userId: string,
    oldHash: string,
    newHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const consumed = await tx.refreshToken.deleteMany({
        where: { userId, tokenHash: oldHash, expiresAt: { gt: new Date() } },
      });

      requireConsumedRefreshToken(consumed.count);

      await tx.refreshToken.create({
        data: { userId, tokenHash: newHash, expiresAt },
      });
    });
  }
}
