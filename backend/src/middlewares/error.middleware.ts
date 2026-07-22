// src/middlewares/errorHandler.ts
import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../shared/errors/api_error.js";
import multer from "multer";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode || 400).json({
      status: "fail",
      message: err.message,
      errors: err.errors // This holds your ['email: Invalid email format'] array
    });
  }

   // Safe string-based check for ESM compatibility
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      status: "fail",
      message: "Invalid or expired token. Please log in again."
   });
  }

  if (err instanceof multer.MulterError) {
    res.status(400).json({
      success: false,
      code: err.code,
      message: err.message === 'File too large' ? 'File size exceeds the 10MB limit' : err.message
    });
    return;
  }

  // Fallback for unexpected system errors
  console.error("💥 Unhandled Error Context:", err);
  return res.status(500).json({
    status: "error",
    message: "Something went wrong on the server"
  });
};
