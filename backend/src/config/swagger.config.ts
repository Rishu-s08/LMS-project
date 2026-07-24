import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LMS Backend API",
      version: "1.0.0",
      description:
        "Learning Management System REST API — Authentication, Users, Courses, Classes, Enrollments, Assignments, Resources, Submissions, and Announcements.",
    },
    servers: [
      { url: "http://localhost:3000/api/v1", description: "Local Development" },
      { url: "http://localhost:8000/api/v1", description: "Docker" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your access token (without 'Bearer ' prefix)",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            errors: { type: "array", items: { type: "string" } },
          },
        },
        User: {
          type: "object",
          properties: {
            userId: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            role: { type: "string", enum: ["STUDENT", "FACULTY", "ADMIN"] },
            branch: { type: "string", nullable: true },
            batch: { type: "string", nullable: true },
            sem: { type: "integer", nullable: true },
            avatarUrl: { type: "string", nullable: true },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Course: {
          type: "object",
          properties: {
            courseId: { type: "string", format: "uuid" },
            name: { type: "string" },
            code: { type: "string" },
            credits: { type: "integer", nullable: true },
            description: { type: "string", nullable: true },
            isArchived: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Class: {
          type: "object",
          properties: {
            classId: { type: "string", format: "uuid" },
            courseId: { type: "string", format: "uuid" },
            facultyId: { type: "string", format: "uuid" },
            semester: { type: "integer" },
            year: { type: "integer" },
            branch: { type: "string" },
            academicYear: { type: "string" },
            isArchived: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Enrollment: {
          type: "object",
          properties: {
            enrollmentId: { type: "string", format: "uuid" },
            classId: { type: "string", format: "uuid" },
            studentId: { type: "string", format: "uuid" },
            enrolledAt: { type: "string", format: "date-time" },
          },
        },
        Assignment: {
          type: "object",
          properties: {
            assignmentId: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            dueDate: { type: "string", format: "date-time" },
            classId: { type: "string", format: "uuid" },
            attachmentUrl: { type: "string", nullable: true },
            isPublished: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Resource: {
          type: "object",
          properties: {
            resourceId: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            classId: { type: "string", format: "uuid" },
            attachmentUrl: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Submission: {
          type: "object",
          properties: {
            submissionId: { type: "string", format: "uuid" },
            assignmentId: { type: "string", format: "uuid" },
            studentId: { type: "string", format: "uuid" },
            attachmentUrl: { type: "string", nullable: true },
            note: { type: "string", nullable: true },
            submittedAt: { type: "string", format: "date-time" },
          },
        },
        Announcement: {
          type: "object",
          properties: {
            announcementId: { type: "string", format: "uuid" },
            title: { type: "string" },
            content: { type: "string" },
            classId: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    tags: [
      { name: "Authentication", description: "Login, logout, token refresh, password reset" },
      { name: "Users", description: "Registration, profile, password management" },
      { name: "Courses", description: "Course CRUD and archival" },
      { name: "Classes", description: "Class management, faculty assignment" },
      { name: "Enrollments", description: "Student enrollment in classes" },
      { name: "Assignments", description: "Assignment CRUD with file upload" },
      { name: "Resources", description: "Class resources/materials" },
      { name: "Submissions", description: "Student assignment submissions" },
      { name: "Announcements", description: "Class announcements" },
    ],
  },
  apis: [
    "./src/modules/**/*.route.ts",
    "./src/modules/**/*.routes.ts",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
