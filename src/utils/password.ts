import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem?: number },
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const MAX_PASSWORD_LENGTH = 128;

const SCRYPT_PARAMS = { N: 131072, r: 8, p: 1 };
const SCRYPT_OPTIONS = { ...SCRYPT_PARAMS, maxmem: 256 * 1024 * 1024 };

function assertPasswordLength(password: string) {
  if (password.length === 0 || password.length > MAX_PASSWORD_LENGTH) {
    throw new Error("Invalid password length");
  }
}

export async function hashPassword(password: string): Promise<string> {
  assertPasswordLength(password);
  const salt = randomBytes(16);
  const hash = (await scrypt(
    password,
    salt,
    KEY_LENGTH,
    SCRYPT_OPTIONS,
  )) as Buffer;

  return `scrypt:${SCRYPT_PARAMS.N}:${SCRYPT_PARAMS.r}:${SCRYPT_PARAMS.p}:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  if (password.length === 0 || password.length > MAX_PASSWORD_LENGTH) {
    return false;
  }

  const [algorithm, nStr, rStr, pStr, saltHex, hashHex] = stored.split(":");
  if (
    algorithm !== "scrypt" ||
    !saltHex ||
    !hashHex ||
    !/^[0-9a-f]{32}$/i.test(saltHex) ||
    !/^[0-9a-f]{128}$/i.test(hashHex)
  ) {
    return false;
  }

  const N = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return false;
  }

  const expected = Buffer.from(hashHex, "hex");
  const actual = (await scrypt(
    password,
    Buffer.from(saltHex, "hex"),
    KEY_LENGTH,
    {
      N,
      r,
      p,
      maxmem: 256 * 1024 * 1024,
    },
  )) as Buffer;

  return timingSafeEqual(actual, expected);
}
