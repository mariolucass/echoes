import { jwtVerify, SignJWT } from "jose";
import { createHash, randomUUID } from "node:crypto";
import { env } from "../config/env.js";

const algorithm = "HS256";
const issuer = "echoes";
const audience = "echoes-api";
const refreshAudience = "echoes-refresh";
export const REFRESH_TOKEN_LIFETIME_SECONDS = 604800;

function getSecret(): Uint8Array {
  if (!env.JWT_SECRET || Buffer.byteLength(env.JWT_SECRET, "utf8") < 32) {
    throw new Error("JWT_SECRET must contain at least 32 bytes");
  }

  return new TextEncoder().encode(env.JWT_SECRET);
}

export async function signAccessToken(userId: string): Promise<string> {
  if (!userId) {
    throw new Error("A user ID is required to sign an access token");
  }

  return new SignJWT({})
    .setProtectedHeader({ alg: algorithm })
    .setSubject(userId)
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getSecret());
}

export async function verifyAccessToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: [algorithm],
    issuer,
    audience,
  });

  if (!payload.sub) {
    throw new Error("Access token has no subject");
  }

  return payload.sub;
}

export async function signRefreshToken(userId: string): Promise<string> {
  if (!userId) throw new Error("A user ID is required to sign a refresh token");

  return new SignJWT({ tokenType: "refresh" })
    .setProtectedHeader({ alg: algorithm })
    .setSubject(userId)
    .setIssuer(issuer)
    .setAudience(refreshAudience)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_LIFETIME_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyRefreshToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: [algorithm],
    issuer,
    audience: refreshAudience,
  });

  if (!payload.sub || !payload.jti || payload.tokenType !== "refresh") {
    throw new Error("Invalid refresh token");
  }
  return payload.sub;
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
