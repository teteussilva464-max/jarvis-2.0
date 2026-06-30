import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { logger } from "../lib/logger.js";
import { defaultUserId, isoDateSchema, validationError } from "./helpers.js";

export const tasksRouter = new Hono();

const prioritySchema = z.enum(["low", "medium", "high", "urgent"]);

const createTaskSchema = z.object({
  title: z.string().trim().min(1),
  priority: prioritySchema.optional(),
  dueDate: isoDateSchema.optional(),
  description: z.string().trim().min(1).optional()
});

const createBatchSchema = z.object({
  titles: z.array(z.string().trim().min(1)).min(1)
});

const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    priority: prioritySchema.optional(),
    dueDate: isoDateSchema.nullable().optional(),
    description: z.string().trim().min(1).nullable().optional()
  })
  .refine((body) => Object.keys(body).length > 0, "At least one field must be provided");

tasksRouter.get("/", async (c) => {
  try {
    const search = c.req.query("search");
    const tasks = await prisma.task.findMany({
      where: {
        userId: defaultUserId(),
        status: "pending",
        ...(search
          ? {
              title: {
                contains: search,
                mode: "insensitive"
              }
            }
          : {})
      },
      orderBy: { createdAt: "desc" }
    });

    return c.json(tasks);
  } catch (error) {
    logger.error({ error }, "Failed to list tasks");
    return c.json({ ok: false, error: "Internal server error" }, 500);
  }
});

tasksRouter.post("/", async (c) => {
  try {
    const body = createTaskSchema.parse(await c.req.json());
    const task = await prisma.task.create({
      data: {
        userId: defaultUserId(),
        title: body.title,
        priority: body.priority ?? "medium",
        dueDate: body.dueDate,
        description: body.description
      }
    });

    return c.json(task, 201);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return c.json({ ok: false, error: validationError(error) }, 400);
    }

    logger.error({ error }, "Failed to create task");
    return c.json({ ok: false, error: "Internal server error" }, 500);
  }
});

tasksRouter.post("/batch", async (c) => {
  try {
    const body = createBatchSchema.parse(await c.req.json());
    const tasks = body.titles.map((title) => ({
      id: randomUUID(),
      userId: defaultUserId(),
      title,
      priority: "medium" as const
    }));

    await prisma.task.createMany({ data: tasks });

    return c.json(tasks.map(({ id, title }) => ({ id, title })), 201);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return c.json({ ok: false, error: validationError(error) }, 400);
    }

    logger.error({ error }, "Failed to create tasks batch");
    return c.json({ ok: false, error: "Internal server error" }, 500);
  }
});

tasksRouter.patch("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existingTask = await prisma.task.findFirst({ where: { id, userId: defaultUserId() } });

    if (!existingTask) {
      return c.json({ ok: false, error: "Task not found" }, 404);
    }

    const body = updateTaskSchema.parse(await c.req.json());
    const task = await prisma.task.update({
      where: { id },
      data: body
    });

    return c.json(task);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return c.json({ ok: false, error: validationError(error) }, 400);
    }

    logger.error({ error }, "Failed to update task");
    return c.json({ ok: false, error: "Internal server error" }, 500);
  }
});

tasksRouter.patch("/:id/complete", async (c) => {
  try {
    const id = c.req.param("id");
    const existingTask = await prisma.task.findFirst({ where: { id, userId: defaultUserId() } });

    if (!existingTask) {
      return c.json({ ok: false, error: "Task not found" }, 404);
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: "completed",
        completedAt: new Date()
      }
    });

    return c.json(task);
  } catch (error) {
    logger.error({ error }, "Failed to complete task");
    return c.json({ ok: false, error: "Internal server error" }, 500);
  }
});

tasksRouter.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existingTask = await prisma.task.findFirst({ where: { id, userId: defaultUserId() } });

    if (!existingTask) {
      return c.json({ ok: false, error: "Task not found" }, 404);
    }

    await prisma.task.delete({ where: { id } });

    return c.json({ ok: true });
  } catch (error) {
    logger.error({ error }, "Failed to delete task");
    return c.json({ ok: false, error: "Internal server error" }, 500);
  }
});

tasksRouter.delete("/", async (c) => {
  try {
    const result = await prisma.task.deleteMany({
      where: {
        userId: defaultUserId(),
        status: "pending"
      }
    });

    return c.json({ deleted: result.count });
  } catch (error) {
    logger.error({ error }, "Failed to delete pending tasks");
    return c.json({ ok: false, error: "Internal server error" }, 500);
  }
});
