import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.config.js";
import { RedisStore } from "rate-limit-redis";
import rateLimit from "express-rate-limit";
import pkg from "pino-http";
const pinoHttp = pkg.default || pkg;
import { redisClient } from "./config/redis.config.js";
import { logger } from "./shared/utils/logger.util.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(express.json());

// Request logging
app.use(pinoHttp({
  logger,
  autoLogging: {
    ignore: (req: any) => req.url === "/api/docs" || req.url?.startsWith("/api/docs/"),
  },
  serializers: {
    req: (req: any) => ({
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress,
    }),
    res: (res: any) => ({
      statusCode: res.statusCode,
    }),
  },
  customSuccessMessage: (_req: any, res: any, responseTime: any) => {
    return `${res.req.method} ${res.req.originalUrl || res.req.url} → ${res.statusCode}`;
  },
  customErrorMessage: (_req: any, res: any, responseTime: any) => {
    return `${res.req.method} ${res.req.originalUrl || res.req.url} → ${res.statusCode}`;
  },
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({ ip: req.ip }, "Rate limit exceeded");
    res.status(429).json({
      success: false,
      message: "Too many requests, please try again later."
    });
  },
  store: new RedisStore({
    sendCommand: async (command: string, ...args: string[]): Promise<any> => {
      return redisClient.call(command, ...args);
    },
  })
}));

// Swagger API Docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/api/v1", (req, res) => {
  res.send("Welcome to the LMS backend!");
});

// Routes
import userRoutes from "./modules/users/users.route.js";
app.use("/api/v1/users", userRoutes);

import authRoutes from "./modules/authentication/auth/auth.route.js";
app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/uploads", express.static("uploads"));

import courseRoutes from "./modules/courses/courses.routes.js";
app.use("/api/v1/courses", courseRoutes);

import classRoutes from "./modules/classes/classes.routes.js";
app.use("/api/v1/classes", classRoutes);

import enrollmentRoutes from "./modules/enrollments/enrollment.route.js";
app.use("/api/v1/enrollments", enrollmentRoutes);

import assignmentRoutes from "./modules/assignments/assignments.route.js";
app.use("/api/v1/assignments", assignmentRoutes);

import resourceRoutes from "./modules/resources/resouces.routes.js";
app.use("/api/v1/resources", resourceRoutes);

import submissionRoutes from "./modules/submissions/submissions.routes.js";
app.use("/api/v1/submissions", submissionRoutes);

import announcementRoutes from "./modules/announcements/annoucements.routes.js";
app.use("/api/v1/announcements", announcementRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
