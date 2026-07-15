
import { Router } from "express";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { roles } from "../../shared/constants/enums.js";
import { CoursesController } from "./courses.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validateParams, validateRequest } from "../../middlewares/validation.middleware.js";
import { courseCodeParamSchema, courseIdParamSchema, createCourseSchema, updateCourseSchema } from "./courses.validation.js";

const router = Router();
const courseController = new CoursesController();

router.get("/", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), courseController.getAllCourses);

router.get("/:courseId", authMiddleware, validateParams(courseIdParamSchema),authorizeRoles(roles.ADMIN, roles.FACULTY), courseController.getCourseById);

router.get("/code/:courseCode", authMiddleware, validateParams(courseCodeParamSchema), authorizeRoles(roles.ADMIN, roles.FACULTY), courseController.getCourseByCode);

router.post("/",authMiddleware, validateRequest(createCourseSchema), authorizeRoles(roles.ADMIN), courseController.createCourse);

router.post("/:courseId/archive", authMiddleware, validateParams(courseIdParamSchema), authorizeRoles(roles.ADMIN), courseController.archiveCourse);

router.post("/:courseId/unarchive", authMiddleware, validateParams(courseIdParamSchema), authorizeRoles(roles.ADMIN), courseController.unarchiveCourse);

router.patch("/:courseId", authMiddleware, validateParams(courseIdParamSchema), validateRequest(updateCourseSchema), authorizeRoles(roles.ADMIN), courseController.updateCourse)


export default router;