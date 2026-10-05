import { createRateLimiter } from "../global/rateLimit.js";

export const authLimiter = createRateLimiter(
  20,
  "Too many authentication attempts from this IP. Try again later.",
);
