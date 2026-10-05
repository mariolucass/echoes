import { z } from "@hono/zod-openapi";
import { ErrorCode } from "../../errors/errorCodes.js";

export const errorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.enum(ErrorCode),
      message: z.string(),
      details: z.unknown().optional(),
      requestId: z.string().optional(),
      timestamp: z.iso.datetime(),
    }),
  })
  .openapi("ErrorResponse");
