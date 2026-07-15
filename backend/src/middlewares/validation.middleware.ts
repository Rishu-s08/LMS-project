// src/middlewares/validateRequest.ts
import type { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { ApiError } from "../shared/errors/api_error.js";
import type { AnyZodObject } from "zod/v3";
import { error } from "console";
import type { ParamsDictionary } from "express-serve-static-core";

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

export const validateParams = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await schema.safeParseAsync(req.params);

    if (!result.success) {
      console.error("❌ Zod Params Validation Error Issues:", result.error.issues); 
      console.log("📦 Incoming Request Params:", req.params); 

      const errorMessages = result.error.issues.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );

      return next(new ApiError(400, "Route parameter validation failed", errorMessages));
    }

    req.params = result.data as ParamsDictionary; // Ensure type safety for req.params
    next();
  };
};
