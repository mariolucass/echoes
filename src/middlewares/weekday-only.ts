import type { MiddlewareHandler } from "hono";
import { env } from "../config/env.js";

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: env.API_TIME_ZONE,
});

export function isWeekday(date: Date): boolean {
  const day = weekdayFormatter.format(date);
  return day !== "Sat" && day !== "Sun";
}

export const weekdayOnly: MiddlewareHandler = async (c, next) => {
  if (!isWeekday(new Date())) {
    return c.json({ message: "API available only from Monday to Friday" }, 403);
  }
  await next();
};
