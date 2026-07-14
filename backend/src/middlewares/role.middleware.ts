import { ApiError } from "../shared/errors/api_error.js";
import type { Request, Response, NextFunction } from "express";



export const authorizeRoles = (...allowedRoles: ("STUDENT" | "FACULTY" | "ADMIN")[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden. Insufficient permissions."));
    }
    next();
  };
};

