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

//get all submissions for a assignment
router.get("/assignments/:assignmentId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateParams(assignmentIdParam), submissionsController.getAllSubmissionsForAssignment);

//get a submission by id
router.get("/:submissionId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateParams(submissionIdParam), submissionsController.getSubmissionById);

//get my submissions for an assignment
router.get("/assignments/:assignmentId/my-submissions", authMiddleware, authorizeRoles(roles.STUDENT),validateParams(assignmentIdParam), submissionsController.getMySubmissionsForAssignment);

//create a submission for an assignment
router.post("/", authMiddleware, authorizeRoles(roles.STUDENT), upload.single("attachment"), validateRequest(submissionSchema), submissionsController.createSubmission);

//update a submission for an assignment
router.patch("/:submissionId", authMiddleware, authorizeRoles(roles.STUDENT), validateParams(submissionIdParam), upload.single("attachment"), validateRequest(updateSubmissionSchema), submissionsController.updateSubmission);

//delete a submission for an assignment
router.delete("/:submissionId", authMiddleware, authorizeRoles(roles.STUDENT), validateParams(submissionIdParam), submissionsController.deleteSubmission);


export default router;