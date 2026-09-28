import { decodeJwt } from "jose";

export function tokenExpiry(token: string): Date {
  const expiresAt = decodeJwt(token).exp;
  if (expiresAt === undefined) {
    throw new Error("Signed token has no expiration");
  }
  return new Date(expiresAt * 1000);
}
