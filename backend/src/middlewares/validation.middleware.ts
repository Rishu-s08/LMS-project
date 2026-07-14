// src/middlewares/validateRequest.ts
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiError } from "../shared/errors/api_error.js";

export const validateRequest = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await schema.safeParseAsync(req.body);

    if (!result.success) {
      // 1. FIXED: Log the actual Zod error issues array ⚡
      console.error("❌ Zod Validation Error Issues:", result.error.issues); 
      
      // 2. Log exactly what data the middleware failed to parse
      console.log("📦 Incoming Request Body:", req.body); 

      // Map Zod errors into a clean, human-readable format
      const errorMessages = result.error.issues.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );

      // Stop execution and hand off directly to your Express error handler
      return next(new ApiError(400, "Validation failed", errorMessages));
    }

    // CRUCIAL: Replace req.body with sanitized data (removes unexpected extra keys)
    req.body = result.data;
    next();
  };
};
