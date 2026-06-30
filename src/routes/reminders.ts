import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { logger } from "../lib/logger.js";
import { defaultUserId, isoDateSchema, validationError } from "./helpers.js";

export const remindersRouter = new Hono();

const createReminderSchema = z.object({
  title: z.string().trim().min(1),
  message: z.string().trim().min(1).optional(),
  remindAt: isoDateSchema,
  recurrence: z.enum(["daily", "weekly", "monthly"]).optional()
});

remindersRouter.get("/", async (c) => {
  try {
    const reminders = await prisma.reminder.findMany({
      where: {
        userId: defaultUserId(),
        status: "pending"
      },
      orderBy: { remindAt: "asc" }
    });

    return c.json(reminders);
  } catch (error) {
    logger.error({ error }, "Failed to list reminders");
    return c.json({ ok: false, error: "Internal server error" }, 500);
  }
});

remindersRouter.post("/", async (c) => {
  try {
    const body = createReminderSchema.parse(await c.req.json());
    const reminder = await prisma.reminder.create({
      data: {
        userId: defaultUserId(),
        title: body.title,
        message: body.message ?? body.title,
        remindAt: body.remindAt,
        recurrence: body.recurrence
      }
    });

    return c.json(reminder, 201);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return c.json({ ok: false, error: validationError(error) }, 400);
    }

    logger.error({ error }, "Failed to create reminder");
    return c.json({ ok: false, error: "Internal server error" }, 500);
  }
});

remindersRouter.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const reminder = await prisma.reminder.findFirst({ where: { id, userId: defaultUserId() } });

    if (!reminder) {
      return c.json({ ok: false, error: "Reminder not found" }, 404);
    }

    await prisma.reminder.update({
      where: { id },
      data: { status: "cancelled" }
    });

    return c.json({ ok: true });
  } catch (error) {
    logger.error({ error }, "Failed to cancel reminder");
    return c.json({ ok: false, error: "Internal server error" }, 500);
  }
});
