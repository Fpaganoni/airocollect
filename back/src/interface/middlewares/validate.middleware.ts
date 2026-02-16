// ──────────────────────────────────────────────
// Interface — Zod Validation Middleware
// ──────────────────────────────────────────────

import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod/v4";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        details: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
