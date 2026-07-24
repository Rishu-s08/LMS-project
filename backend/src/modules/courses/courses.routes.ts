import { Router } from "express";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { roles } from "../../shared/constants/enums.js";
import { CoursesController } from "./courses.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validateParams, validateRequest } from "../../middlewares/validation.middleware.js";
import { courseCodeParamSchema, courseIdParamSchema, createCourseSchema, updateCourseSchema } from "./courses.validation.js";

const router = Router();
const courseController = new CoursesController();

/**
 * @openapi
 * /courses:
 *   get:
 *     tags: [Courses]
 *     summary: Get all courses
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all courses
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
 *                     $ref: '#/components/schemas/Course'
 */
router.get("/", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), courseController.getAllCourses);

/**
 * @openapi
 * /courses/{courseId}:
 *   get:
 *     tags: [Courses]
 *     summary: Get course by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Course found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 */
router.get("/:courseId", authMiddleware, validateParams(courseIdParamSchema),authorizeRoles(roles.ADMIN, roles.FACULTY), courseController.getCourseById);

/**
 * @openapi
 * /courses/code/{courseCode}:
 *   get:
 *     tags: [Courses]
 *     summary: Get course by code
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseCode
 *         required: true
 *         schema:
 *           type: string
 *         example: CS101
 *     responses:
 *       200:
 *         description: Course found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 */
router.get("/code/:courseCode", authMiddleware, validateParams(courseCodeParamSchema), authorizeRoles(roles.ADMIN, roles.FACULTY), courseController.getCourseByCode);

/**
 * @openapi
 * /courses:
 *   post:
 *     tags: [Courses]
 *     summary: Create a new course
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code, credits]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *               code:
 *                 type: string
 *                 minLength: 2
 *                 example: CS101
 *               description:
 *                 type: string
 *                 nullable: true
 *               credits:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *     responses:
 *       201:
 *         description: Course created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       403:
 *         description: Forbidden — requires ADMIN role
 */
router.post("/",authMiddleware, validateRequest(createCourseSchema), authorizeRoles(roles.ADMIN), courseController.createCourse);

/**
 * @openapi
 * /courses/{courseId}/archive:
 *   post:
 *     tags: [Courses]
 *     summary: Archive a course (soft-delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Course archived
 *       404:
 *         description: Course not found
 */
router.post("/:courseId/archive", authMiddleware, validateParams(courseIdParamSchema), authorizeRoles(roles.ADMIN), courseController.archiveCourse);

/**
 * @openapi
 * /courses/{courseId}/unarchive:
 *   post:
 *     tags: [Courses]
 *     summary: Unarchive a course
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Course unarchived
 *       404:
 *         description: Course not found
 */
router.post("/:courseId/unarchive", authMiddleware, validateParams(courseIdParamSchema), authorizeRoles(roles.ADMIN), courseController.unarchiveCourse);

/**
 * @openapi
 * /courses/{courseId}:
 *   patch:
 *     tags: [Courses]
 *     summary: Update a course (partial)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
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
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *               credits:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Course updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 */
router.patch("/:courseId", authMiddleware, validateParams(courseIdParamSchema), validateRequest(updateCourseSchema), authorizeRoles(roles.ADMIN), courseController.updateCourse)


export default router;
