import { secureHeaders } from "hono/secure-headers";

export const securityHeaders = secureHeaders({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: "cross-origin",
});
