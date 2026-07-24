import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { SubmissionsService } from "./submissions.service.js";



export class SubmissionsController {
    private readonly submissionsService: SubmissionsService;
    constructor() {
        this.submissionsService = new SubmissionsService();
    }

    getAllSubmissionsForAssignment = asyncHandler(async (req, res) => {
        const {assignmentId}= req.params;
        const submissions = await this.submissionsService.getAllSubmissionsForAssignment(assignmentId as string);
        res.status(200).json({
            success: true,
            message : "Submissions fetched successfully",
            data: submissions
        });
    });

    getSubmissionById = asyncHandler(async (req, res) => {
        const {submissionId} = req.params;
        const submission = await this.submissionsService.getSubmissionById(submissionId as string);
        res.status(200).json({
            success: true,
            message : "Submission fetched successfully",
            data: submission
        });
    });

    getMySubmissionsForAssignment = asyncHandler(async (req, res) => {
        const {assignmentId} = req.params;
        const studentId = req.user?.sub as string;
        const submissions = await this.submissionsService.getMySubmissionsForAssignment(assignmentId as string, studentId);
        res.status(200).json({
            success: true,
            message : "Submissions fetched successfully",
            data: submissions
        });
    });

    createSubmission = asyncHandler(async (req, res) => {
        const submissionData = req.body;
        const studentId = req.user?.sub as string;
        const file = req.file || null;
        const newSubmission = await this.submissionsService.createSubmission(submissionData, studentId, file);
        res.status(201).json({
            success: true,
            message : "Submission created successfully",
            data: newSubmission
        });
    });

    updateSubmission = asyncHandler(async (req, res) => {
        const {submissionId} = req.params;
        const submissionData = req.body;
        const studentId = req.user?.sub as string;
        const file = req.file || null;
        const updatedSubmission = await this.submissionsService.updateSubmission(submissionId as string, submissionData, studentId, file);
        res.status(200).json({
            success: true,
            message : "Submission updated successfully",
            data: updatedSubmission
        });
    });


    deleteSubmission = asyncHandler(async (req, res) => {
        const {submissionId} = req.params;
        const studentId = req.user?.sub as string;
        await this.submissionsService.deleteSubmission(submissionId as string, studentId);
        res.status(200).json({
            success: true,
            message : "Submission deleted successfully"
        });
    });
}