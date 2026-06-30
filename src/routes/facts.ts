import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { logger } from "../lib/logger.js";
import { defaultUserId, validationError } from "./helpers.js";

export const factsRouter = new Hono();

const createFactSchema = z.object({
  category: z.enum(["preference", "identity", "routine", "work", "project", "other"]),
  fact: z.string().trim().min(1),
  confidence: z.number().min(0).max(1).optional()
});

factsRouter.get("/", async (c) => {
  try {
    const facts = await prisma.userFact.findMany({
      where: { userId: defaultUserId() },
      orderBy: { createdAt: "desc" }
    });

    return c.json(facts);
  } catch (error) {
    logger.error({ error }, "Failed to list user facts");
    return c.json({ ok: false, error: "Internal server error" }, 500);
  }
});

factsRouter.post("/", async (c) => {
  try {
    const body = createFactSchema.parse(await c.req.json());
    const fact = await prisma.userFact.create({
      data: {
        userId: defaultUserId(),
        category: body.category,
        fact: body.fact,
        confidence: body.confidence ?? 0.7
      }
    });

    return c.json(fact, 201);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return c.json({ ok: false, error: validationError(error) }, 400);
    }

    logger.error({ error }, "Failed to create user fact");
    return c.json({ ok: false, error: "Internal server error" }, 500);
  }
});

factsRouter.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const fact = await prisma.userFact.findFirst({ where: { id, userId: defaultUserId() } });

    if (!fact) {
      return c.json({ ok: false, error: "Fact not found" }, 404);
    }

    await prisma.userFact.delete({ where: { id } });

    return c.json({ ok: true });
  } catch (error) {
    logger.error({ error }, "Failed to delete user fact");
    return c.json({ ok: false, error: "Internal server error" }, 500);
  }
});
