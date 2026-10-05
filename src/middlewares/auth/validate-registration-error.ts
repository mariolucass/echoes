import { ConflictError } from "../../errors/AppError.js";

export function rethrowRegistrationError(error: unknown): never {
  if (
    error instanceof Error &&
    error.name === "PrismaClientKnownRequestError" &&
    "code" in error &&
    error.code === "P2002"
  ) {
    throw new ConflictError("Email already registered.");
  }
  throw error;
}
