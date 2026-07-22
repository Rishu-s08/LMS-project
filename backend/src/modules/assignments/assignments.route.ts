
import { Router } from "express";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { roles } from "../../shared/constants/enums.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import upload from "../../config/multer.config.js";
import { validateParams, validateRequest } from "../../middlewares/validation.middleware.js";
import { assignmentIdParam, classIdParam, createAssignmentSchema, updateAssignmentSchema } from "./assignments.validation.js";
import { AssignmentsController } from "./assignments.controller.js";

const router = Router();
const assignmentController = new AssignmentsController();

// get all assignments do we need it? it will have all assignments of all classes
router.get("/", authMiddleware, authorizeRoles(roles.ADMIN), assignmentController.getAssignments)


// get assign by id
router.get("/:assignmentId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateParams(assignmentIdParam), assignmentController.getAssignmentById)


// get assignment by class
router.get("/classes/:classId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY, roles.STUDENT), validateParams(classIdParam), assignmentController.getAssignmentsByClassId)


// create assignment
router.post("/", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), upload.single("attachment"), validateRequest(createAssignmentSchema), assignmentController.createAssignment)


//update assignment
router.patch("/:assignmentId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), upload.single("attachment"), validateParams(assignmentIdParam), validateRequest(updateAssignmentSchema), assignmentController.updateAssignment)


//delete assignment
router.delete("/:assignmentId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateParams(assignmentIdParam), assignmentController.deleteAssignment)



export default router;
