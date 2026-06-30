import { z } from "zod";

export const defaultUserId = () => process.env.DEFAULT_USER_ID ?? "user_default";

export const isoDateSchema = z.string().datetime().transform((value) => new Date(value));

export function validationError(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues.map((issue) => issue.message).join("; ");
  }

  if (error instanceof SyntaxError) {
    return "Invalid JSON body";
  }

  return "Invalid request body";
}
