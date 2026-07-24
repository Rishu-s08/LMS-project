
import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.config.js";

const app = express();

app.use(express.json());

// Swagger API Docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/api/v1", (req, res) => {
  res.send("Welcome to the LMS backend!");
});


// User Routes
import userRoutes from "./modules/users/users.route.js";

app.use("/api/v1/users", userRoutes);


// Authentication Routes
import authRoutes from "./modules/authentication/auth/auth.route.js";
import { errorHandler } from "./middlewares/error.middleware.js";

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/uploads", express.static("uploads"));

// Course Routes
import courseRoutes from "./modules/courses/courses.routes.js";
app.use("/api/v1/courses", courseRoutes);


// Class Routes
import classRoutes from "./modules/classes/classes.routes.js";
app.use("/api/v1/classes", classRoutes);

// Enrollment Routes
import enrollmentRoutes from "./modules/enrollments/enrollment.route.js";
app.use("/api/v1/enrollments", enrollmentRoutes);


// Assignment Routes
import assignmentRoutes from "./modules/assignments/assignments.route.js";
app.use("/api/v1/assignments", assignmentRoutes);


// resources Route
import resourceRoutes from "./modules/resources/resouces.routes.js";
app.use("/api/v1/resources", resourceRoutes);


// submissions Route
import submissionRoutes from "./modules/submissions/submissions.routes.js";
app.use("/api/v1/submissions", submissionRoutes);


// announcements Route
import announcementRoutes from "./modules/announcements/annoucements.routes.js";
app.use("/api/v1/announcements", announcementRoutes);

app.use(errorHandler);

export default app;
