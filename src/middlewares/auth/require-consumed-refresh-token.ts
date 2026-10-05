import { UnauthorizedError } from "../../errors/AppError.js";

export function requireConsumedRefreshToken(consumedCount: number): void {
  if (consumedCount !== 1) {
    throw new UnauthorizedError("Invalid refresh token.");
  }
}
