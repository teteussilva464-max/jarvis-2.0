import type { MiddlewareHandler } from "hono";
import { createHash, timingSafeEqual } from "node:crypto";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const apiKey = c.req.header("X-API-Key");
  const expectedKey = process.env.JARVIS_API_KEY;

  if (!apiKey || !expectedKey) {
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }

  const provided = createHash("sha256").update(apiKey).digest();
  const expected = createHash("sha256").update(expectedKey).digest();

  if (!timingSafeEqual(provided, expected)) {
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }

  await next();
};
