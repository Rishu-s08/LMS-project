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

/**
 * @openapi
 * /assignments:
 *   get:
 *     tags: [Assignments]
 *     summary: Get all assignments (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all assignments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Assignment'
 */
router.get("/", authMiddleware, authorizeRoles(roles.ADMIN), assignmentController.getAssignments)

/**
 * @openapi
 * /assignments/{assignmentId}:
 *   get:
 *     tags: [Assignments]
 *     summary: Get assignment by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Assignment found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *       404:
 *         description: Assignment not found
 */
router.get("/:assignmentId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateParams(assignmentIdParam), assignmentController.getAssignmentById)

/**
 * @openapi
 * /assignments/classes/{classId}:
 *   get:
 *     tags: [Assignments]
 *     summary: Get all assignments for a class
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of assignments for the class
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Assignment'
 *       404:
 *         description: Class not found
 */
router.get("/classes/:classId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY, roles.STUDENT), validateParams(classIdParam), assignmentController.getAssignmentsByClassId)

/**
 * @openapi
 * /assignments:
 *   post:
 *     tags: [Assignments]
 *     summary: Create a new assignment
 *     description: Supports optional file attachment via multipart/form-data. Due date must be in the future.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, dueDate, classId]
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 nullable: true
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Must be a future date (ISO 8601)
 *               classId:
 *                 type: string
 *                 format: uuid
 *               isPublished:
 *                 type: boolean
 *                 default: true
 *               attachment:
 *                 type: string
 *                 format: binary
 *                 description: "PDF, JPEG, or PNG (max 10MB)"
 *     responses:
 *       201:
 *         description: Assignment created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *       400:
 *         description: Due date is in the past
 *       404:
 *         description: Class not found
 */
router.post("/", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), upload.single("attachment"), validateRequest(createAssignmentSchema), assignmentController.createAssignment)

/**
 * @openapi
 * /assignments/{assignmentId}:
 *   patch:
 *     tags: [Assignments]
 *     summary: Update an assignment (partial)
 *     description: Cannot update after due date has passed. If a new file is uploaded, the old one is deleted from cloud.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               classId:
 *                 type: string
 *                 format: uuid
 *               isPublished:
 *                 type: boolean
 *               attachment:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Assignment updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *       400:
 *         description: Due date has passed — cannot update
 *       404:
 *         description: Assignment not found
 */
router.patch("/:assignmentId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), upload.single("attachment"), validateParams(assignmentIdParam), validateRequest(updateAssignmentSchema), assignmentController.updateAssignment)

/**
 * @openapi
 * /assignments/{assignmentId}:
 *   delete:
 *     tags: [Assignments]
 *     summary: Delete an assignment
 *     description: Deletes the assignment record and removes the attachment from cloud storage if present
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Assignment deleted
 *       404:
 *         description: Assignment not found
 */
router.delete("/:assignmentId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateParams(assignmentIdParam), assignmentController.deleteAssignment)



export default router;
