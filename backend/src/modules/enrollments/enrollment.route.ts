import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { roles } from "../../shared/constants/enums.js";
import { EnrollmentsController } from "./enrollments.controller.js";
import { validateParams, validateRequest } from "../../middlewares/validation.middleware.js";
import { CreateEnrollmentSchema, enrollmentIdParamSchema, studentIdParamSchema, classIdParamSchema } from "./enrollment.validation.js";



const router  = Router();

const enrollmentsController = new EnrollmentsController();

router.get("/:enrollmentId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateParams(enrollmentIdParamSchema), enrollmentsController.getEnrollmentById)

router.post("/", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateRequest(CreateEnrollmentSchema), enrollmentsController.createEnrollment)

router.delete("/:enrollmentId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateParams(enrollmentIdParamSchema), enrollmentsController.deleteEnrollment)

router.get("/students/:studentId/classes", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY, roles.STUDENT), validateParams(studentIdParamSchema), enrollmentsController.getAllClassesByStudentId)

router.get("/classes/:classId/students", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY, roles.STUDENT), validateParams(classIdParamSchema), enrollmentsController.getAllStudentsByClassId)

export default router;


