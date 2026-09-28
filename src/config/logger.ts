import pino from "pino";

const environment = process.env.NODE_ENV ?? "development";
const logLevel =
  process.env.LOG_LEVEL ?? (environment === "production" ? "info" : "debug");

const transport =
  environment === "development"
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined;

export const logger = pino({
  level: environment === "test" ? "silent" : logLevel,
  transport,
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: environment,
    pid: process.pid,
    version: process.env.APP_VERSION,
  },

  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "*.password",
      "token",
      "*.token",
    ],
    censor: "[REDACTED]",
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
  },
});
