import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { roles } from "../../shared/constants/enums.js";
import { validateParams, validateRequest } from "../../middlewares/validation.middleware.js";
import { assignmentIdParam, submissionIdParam, submissionSchema, updateSubmissionSchema } from "./submissions.validation.js";
import upload from "../../config/multer.config.js";
import { SubmissionsController } from "./submissions.controller.js";


const router = Router();
const submissionsController = new SubmissionsController();

/**
 * @openapi
 * /submissions/assignments/{assignmentId}:
 *   get:
 *     tags: [Submissions]
 *     summary: Get all submissions for an assignment
 *     description: Faculty/admin can view all student submissions for grading
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
 *         description: List of submissions
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
 *                     $ref: '#/components/schemas/Submission'
 *       404:
 *         description: Assignment not found
 */
router.get("/assignments/:assignmentId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateParams(assignmentIdParam), submissionsController.getAllSubmissionsForAssignment);

/**
 * @openapi
 * /submissions/{submissionId}:
 *   get:
 *     tags: [Submissions]
 *     summary: Get submission by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Submission found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Submission'
 *       404:
 *         description: Submission not found
 */
router.get("/:submissionId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateParams(submissionIdParam), submissionsController.getSubmissionById);

/**
 * @openapi
 * /submissions/assignments/{assignmentId}/my-submissions:
 *   get:
 *     tags: [Submissions]
 *     summary: Get current student's submission for an assignment
 *     description: Uses the composite unique key (assignmentId, studentId) for lookup
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
 *         description: Student's submission for the assignment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Submission'
 *       404:
 *         description: Assignment not found
 */
router.get("/assignments/:assignmentId/my-submissions", authMiddleware, authorizeRoles(roles.STUDENT),validateParams(assignmentIdParam), submissionsController.getMySubmissionsForAssignment);

/**
 * @openapi
 * /submissions:
 *   post:
 *     tags: [Submissions]
 *     summary: Submit work for an assignment
 *     description: |
 *       Student submits work. Enforces:
 *       - Student must be enrolled in the assignment's class
 *       - Cannot submit after due date
 *       - studentId must match the authenticated user
 *       - One submission per student per assignment (unique constraint)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [assignmentId, studentId]
 *             properties:
 *               assignmentId:
 *                 type: string
 *                 format: uuid
 *               studentId:
 *                 type: string
 *                 format: uuid
 *                 description: Must match the authenticated user's ID
 *               note:
 *                 type: string
 *                 maxLength: 500
 *                 nullable: true
 *               attachment:
 *                 type: string
 *                 format: binary
 *                 description: "PDF, JPEG, or PNG (max 10MB)"
 *     responses:
 *       201:
 *         description: Submission created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Submission'
 *       400:
 *         description: Due date has passed
 *       403:
 *         description: Not authorized (studentId mismatch or not enrolled)
 *       404:
 *         description: Assignment not found or student not enrolled
 */
router.post("/", authMiddleware, authorizeRoles(roles.STUDENT), upload.single("attachment"), validateRequest(submissionSchema), submissionsController.createSubmission);

/**
 * @openapi
 * /submissions/{submissionId}:
 *   patch:
 *     tags: [Submissions]
 *     summary: Update a submission
 *     description: |
 *       Only the owning student can update. Cannot update after due date.
 *       Cannot change the assignment reference. File replacement deletes the old cloud file.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
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
 *               note:
 *                 type: string
 *                 maxLength: 500
 *               attachment:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Submission updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Submission'
 *       400:
 *         description: Due date has passed or trying to change assignment
 *       403:
 *         description: Not the submission owner
 *       404:
 *         description: Submission not found
 */
router.patch("/:submissionId", authMiddleware, authorizeRoles(roles.STUDENT), validateParams(submissionIdParam), upload.single("attachment"), validateRequest(updateSubmissionSchema), submissionsController.updateSubmission);

/**
 * @openapi
 * /submissions/{submissionId}:
 *   delete:
 *     tags: [Submissions]
 *     summary: Delete a submission
 *     description: Only the owning student can delete. Cannot delete after due date. Removes cloud file if present.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Submission deleted
 *       400:
 *         description: Due date has passed
 *       403:
 *         description: Not the submission owner
 *       404:
 *         description: Submission not found
 */
router.delete("/:submissionId", authMiddleware, authorizeRoles(roles.STUDENT), validateParams(submissionIdParam), submissionsController.deleteSubmission);


export default router;
