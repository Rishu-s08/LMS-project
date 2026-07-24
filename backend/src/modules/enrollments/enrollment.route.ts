import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { roles } from "../../shared/constants/enums.js";
import { EnrollmentsController } from "./enrollments.controller.js";
import { validateParams, validateRequest } from "../../middlewares/validation.middleware.js";
import { CreateEnrollmentSchema, enrollmentIdParamSchema, studentIdParamSchema, classIdParamSchema } from "./enrollment.validation.js";



const router  = Router();

const enrollmentsController = new EnrollmentsController();

/**
 * @openapi
 * /enrollments/{enrollmentId}:
 *   get:
 *     tags: [Enrollments]
 *     summary: Get enrollment by ID
 *     description: Returns enrollment with included student and class data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Enrollment found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 *       404:
 *         description: Enrollment not found
 */
router.get("/:enrollmentId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateParams(enrollmentIdParamSchema), enrollmentsController.getEnrollmentById)

/**
 * @openapi
 * /enrollments:
 *   post:
 *     tags: [Enrollments]
 *     summary: Enroll a student in a class
 *     description: Creates an enrollment. DB unique constraint prevents duplicate enrollments.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, classId]
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *               classId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Student enrolled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 *       409:
 *         description: Student already enrolled in this class (unique constraint)
 */
router.post("/", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateRequest(CreateEnrollmentSchema), enrollmentsController.createEnrollment)

/**
 * @openapi
 * /enrollments/{enrollmentId}:
 *   delete:
 *     tags: [Enrollments]
 *     summary: Remove an enrollment (unenroll student)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Enrollment deleted
 *       404:
 *         description: Enrollment not found
 */
router.delete("/:enrollmentId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateParams(enrollmentIdParamSchema), enrollmentsController.deleteEnrollment)

/**
 * @openapi
 * /enrollments/students/{studentId}/classes:
 *   get:
 *     tags: [Enrollments]
 *     summary: Get all classes a student is enrolled in
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of classes the student is enrolled in
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
 *       404:
 *         description: Student not found
 */
router.get("/students/:studentId/classes", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY, roles.STUDENT), validateParams(studentIdParamSchema), enrollmentsController.getAllClassesByStudentId)

/**
 * @openapi
 * /enrollments/classes/{classId}/students:
 *   get:
 *     tags: [Enrollments]
 *     summary: Get all students enrolled in a class
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
 *         description: List of students enrolled in the class
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
 *                     $ref: '#/components/schemas/User'
 *       404:
 *         description: Class not found
 */
router.get("/classes/:classId/students", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY, roles.STUDENT), validateParams(classIdParamSchema), enrollmentsController.getAllStudentsByClassId)

export default router;
