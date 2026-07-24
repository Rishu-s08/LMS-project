import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { Role } from "../../generated/prisma/enums.js";
import { validateParams, validateRequest } from "../../middlewares/validation.middleware.js";
import { classIdParamSchema, CreateClassSchema, UpdateClassSchema, userIdParamSchema } from "./classes.validation.js";
import { ClassesController } from "./classes.controller.js";



const router = Router();
const classesController = new ClassesController();

/**
 * @openapi
 * /classes:
 *   get:
 *     tags: [Classes]
 *     summary: Get all classes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all classes
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
 *                     $ref: '#/components/schemas/Class'
 */
router.get("/", authMiddleware, authorizeRoles(Role.ADMIN, Role.FACULTY, Role.STUDENT), classesController.getAllClasses)

/**
 * @openapi
 * /classes/faculty/{facultyId}:
 *   get:
 *     tags: [Classes]
 *     summary: Get all classes for a specific faculty member
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facultyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of classes assigned to this faculty
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
 *                     $ref: '#/components/schemas/Class'
 *       400:
 *         description: User is not a faculty member
 *       404:
 *         description: Faculty not found
 */
router.get("/faculty/:facultyId", authMiddleware, authorizeRoles(Role.ADMIN, Role.FACULTY), validateParams(userIdParamSchema), classesController.getClassesByFacultyId)

/**
 * @openapi
 * /classes/{classId}:
 *   get:
 *     tags: [Classes]
 *     summary: Get class by ID
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
 *         description: Class found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       404:
 *         description: Class not found
 */
router.get("/:classId", authMiddleware, authorizeRoles(Role.ADMIN, Role.FACULTY, Role.STUDENT), validateParams(classIdParamSchema), classesController.getClassById)

/**
 * @openapi
 * /classes:
 *   post:
 *     tags: [Classes]
 *     summary: Create a new class
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [facultyId, semester, year, branch, academicYear, courseId]
 *             properties:
 *               facultyId:
 *                 type: string
 *                 format: uuid
 *               semester:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 8
 *               year:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 4
 *               branch:
 *                 type: string
 *               academicYear:
 *                 type: string
 *                 pattern: '^\d{4}-\d{4}$'
 *                 example: "2025-2026"
 *               courseId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Class created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       400:
 *         description: Faculty user is a STUDENT (invalid)
 *       404:
 *         description: Faculty or course not found
 */
router.post("/", authMiddleware, validateRequest(CreateClassSchema), authorizeRoles(Role.ADMIN, Role.FACULTY), classesController.createClass)

/**
 * @openapi
 * /classes/{classId}:
 *   patch:
 *     tags: [Classes]
 *     summary: Update a class (partial)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               facultyId:
 *                 type: string
 *                 format: uuid
 *               semester:
 *                 type: integer
 *               year:
 *                 type: integer
 *               branch:
 *                 type: string
 *               academicYear:
 *                 type: string
 *               courseId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Class updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       404:
 *         description: Class not found
 */
router.patch("/:classId", authMiddleware, authorizeRoles(Role.ADMIN, Role.FACULTY), validateParams(classIdParamSchema), validateRequest(UpdateClassSchema), classesController.updateClass)

/**
 * @openapi
 * /classes/{classId}/archive:
 *   post:
 *     tags: [Classes]
 *     summary: Archive a class (soft-delete)
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
 *         description: Class archived
 *       404:
 *         description: Class not found
 */
router.post("/:classId/archive", authMiddleware, authorizeRoles(Role.ADMIN, Role.FACULTY), validateParams(classIdParamSchema), classesController.archiveClass)

/**
 * @openapi
 * /classes/{classId}/unarchive:
 *   post:
 *     tags: [Classes]
 *     summary: Unarchive a class
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
 *         description: Class unarchived
 *       404:
 *         description: Class not found
 */
router.post("/:classId/unarchive", authMiddleware, authorizeRoles(Role.ADMIN, Role.FACULTY), validateParams(classIdParamSchema), classesController.unarchiveClass)


export default router;
