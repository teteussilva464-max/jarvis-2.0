import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { authMiddleware } from "./middleware/auth.js";
import { prisma } from "./lib/db.js";
import { logger } from "./lib/logger.js";
import { factsRouter } from "./routes/facts.js";
import { goalsRouter } from "./routes/goals.js";
import { remindersRouter } from "./routes/reminders.js";
import { tasksRouter } from "./routes/tasks.js";

const requiredEnvVars = ["JARVIS_API_KEY", "DATABASE_URL", "DEFAULT_USER_ID"] as const;
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`[JARVIS] Variável de ambiente obrigatória não definida: ${key}`);
    process.exit(1);
  }
}

const app = new Hono();

app.use(async (c, next) => {
  const startedAt = Date.now();
  await next();
  logger.info(
    {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Date.now() - startedAt
    },
    "Request completed"
  );
});

app.use(bodyLimit({ maxSize: 50 * 1024 }));

app.get("/health", async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({
      ok: true,
      version: "2.0.0",
      timestamp: new Date().toISOString()
    });
  } catch {
    return c.json({ ok: false, error: "Database unavailable" }, 503);
  }
});

app.use("*", authMiddleware);
app.route("/tasks", tasksRouter);
app.route("/reminders", remindersRouter);
app.route("/goals", goalsRouter);
app.route("/facts", factsRouter);

app.onError((error, c) => {
  logger.error({ error }, "Unhandled application error");
  return c.json({ ok: false, error: "Internal server error" }, 500);
});

const port = Number(process.env.PORT ?? 3001);

const server = serve(
  {
    fetch: app.fetch,
    port
  },
  () => {
    logger.info(`JARVIS 2.0 API listening on port ${port}`);
  }
);

const shutdown = async () => {
  logger.info("Encerrando JARVIS API...");
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
