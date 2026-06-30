import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { logger } from "../lib/logger.js";
import { defaultUserId, isoDateSchema, validationError } from "./helpers.js";

export const goalsRouter = new Hono();

const createGoalSchema = z
  .object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    schedule: z.string().trim().min(1).optional(),
    triggerAt: isoDateSchema.optional()
  })
  .refine((body) => body.schedule || body.triggerAt, "Either schedule or triggerAt must be provided");

goalsRouter.get("/", async (c) => {
  try {
    const goals = await prisma.goal.findMany({
      where: {
        userId: defaultUserId(),
        status: "active"
      },
      orderBy: { createdAt: "desc" }
    });

    return c.json(goals);
  } catch (error) {
    logger.error({ error }, "Failed to list goals");
    return c.json({ ok: false, error: "Internal server error" }, 500);
  }
});

goalsRouter.post("/", async (c) => {
  try {
    const body = createGoalSchema.parse(await c.req.json());
    const goal = await prisma.goal.create({
      data: {
        userId: defaultUserId(),
        title: body.title,
        description: body.description,
        schedule: body.schedule,
        triggerAt: body.triggerAt
      }
    });

    return c.json(goal, 201);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return c.json({ ok: false, error: validationError(error) }, 400);
    }

    logger.error({ error }, "Failed to create goal");
    return c.json({ ok: false, error: "Internal server error" }, 500);
  }
});

goalsRouter.patch("/:id/pause", async (c) => {
  try {
    const id = c.req.param("id");
    const goal = await prisma.goal.findFirst({ where: { id, userId: defaultUserId() } });

    if (!goal) {
      return c.json({ ok: false, error: "Goal not found" }, 404);
    }

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: { status: "paused" },
      select: { id: true, status: true }
    });

    return c.json(updatedGoal);
  } catch (error) {
    logger.error({ error }, "Failed to pause goal");
    return c.json({ ok: false, error: "Internal server error" }, 500);
  }
});
