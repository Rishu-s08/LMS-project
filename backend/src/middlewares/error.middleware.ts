import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../shared/errors/api_error.js";
import { logger } from "../shared/utils/logger.util.js";
import multer from "multer";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    logger.warn({ statusCode: err.statusCode, message: err.message, path: req.path }, "API error");
    return res.status(err.statusCode || 400).json({
      status: "fail",
      message: err.message,
      errors: err.errors
    });
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    logger.warn({ path: req.path, tokenError: err.name }, "JWT error");
    return res.status(401).json({
      status: "fail",
      message: "Invalid or expired token. Please log in again."
    });
  }

  if (err instanceof multer.MulterError) {
    logger.warn({ code: err.code, message: err.message }, "Multer error");
    res.status(400).json({
      success: false,
      code: err.code,
      message: err.message === 'File too large' ? 'File size exceeds the 10MB limit' : err.message
    });
    return;
  }

  // Unhandled errors — these need attention
  logger.error({ err, path: req.path, method: req.method }, "Unhandled server error");
  return res.status(500).json({
    status: "error",
    message: "Something went wrong on the server"
  });
};
