import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { Role } from "../../generated/prisma/enums.js";
import { validateParams, validateRequest } from "../../middlewares/validation.middleware.js";
import { classIdParamSchema, CreateClassSchema, UpdateClassSchema, userIdParamSchema } from "./classes.validation.js";
import { de } from "zod/locales";
import { ClassesController } from "./classes.controller.js";



const router = Router();
const classesController = new ClassesController();

// get all classes 
router.get("/", authMiddleware, authorizeRoles(Role.ADMIN, Role.FACULTY, Role.STUDENT), classesController.getAllClasses)

// get classes by facultyId
router.get("/faculty/:facultyId", authMiddleware, authorizeRoles(Role.ADMIN, Role.FACULTY), validateParams(userIdParamSchema), classesController.getClassesByFacultyId)

// get class by classId
router.get("/:classId", authMiddleware, authorizeRoles(Role.ADMIN, Role.FACULTY, Role.STUDENT), validateParams(classIdParamSchema), classesController.getClassById)

// create a new class
router.post("/", authMiddleware, validateRequest(CreateClassSchema), authorizeRoles(Role.ADMIN, Role.FACULTY), classesController.createClass)

// update a class
router.patch("/:classId", authMiddleware, authorizeRoles(Role.ADMIN, Role.FACULTY), validateParams(classIdParamSchema), validateRequest(UpdateClassSchema), classesController.updateClass)

// archive a class
router.post("/:classId/archive", authMiddleware, authorizeRoles(Role.ADMIN, Role.FACULTY), validateParams(classIdParamSchema), classesController.archiveClass)

// unarchive a class
router.post("/:classId/unarchive", authMiddleware, authorizeRoles(Role.ADMIN, Role.FACULTY), validateParams(classIdParamSchema), classesController.unarchiveClass)

// get faculty of a class // i think do we need this route? we can get the facultyId from the class object itself
// router.get("/:classId/faculty", authMiddleware, authorizeRoles(Role.ADMIN, Role.FACULTY, Role.STUDENT), classesController.getFacultyOfClass)

// get course of a class // i think do we need this route? we can get the courseId from the class object itself
// router.get("/:classId/course" , authMiddleware, authorizeRoles(Role.ADMIN, Role.FACULTY, Role.STUDENT), classesController.getCourseOfClass)


export default router;