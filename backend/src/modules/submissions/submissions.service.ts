import { SupabaseConstants } from "../../shared/constants/supabase.constants.js";
import { ApiError } from "../../shared/errors/api_error.js";
import { deleteFromCloud, uploadToCloud } from "../../shared/utils/supabase.util.js";
import { AssignmentsService } from "../assignments/assignments.service.js";
import { EnrollmentsService } from "../enrollments/enrollments.service.js";
import { UserService } from "../users/users.services.js";
import { SubmissionsRepository } from "./submissions.repository.js";
import type { CreateSubmissionInput } from "./submissions.validation.js";


export class SubmissionsService{
    private readonly submissionsRepository : SubmissionsRepository;
    private readonly userService : UserService;
    private readonly assignmentService : AssignmentsService;
    private readonly enrollmentService : EnrollmentsService;
    constructor(){
        this.submissionsRepository = new SubmissionsRepository();
        this.userService = new UserService();
        this.assignmentService = new AssignmentsService();
        this.enrollmentService = new EnrollmentsService();
    }

    async getAllSubmissionsForAssignment(assignmentId: string) {
        const assignment = await this.assignmentService.getAssignmentById(assignmentId);
        if(!assignment){
            throw new ApiError(404, "Assignment not found");
        }
        return await this.submissionsRepository.getAllSubmissionsForAssignment(assignmentId);
    }

    async getSubmissionById(submissionId: string) {
        const submission = await this.submissionsRepository.getSubmissionById(submissionId);
        if(!submission){
            throw new ApiError(404, "Submission not found");
        }
        return submission;
    }

    async getMySubmissionsForAssignment(assignmentId: string, studentId: string) {
        const assignment = await this.assignmentService.getAssignmentById(assignmentId);
        if(!assignment){
            throw new ApiError(404, "Assignment not found");
        }
        const student = await this.userService.getUserById(studentId);
        if(!student){
            throw new ApiError(404, "Student not found");
        }
        return await this.submissionsRepository.getMySubmissionsForAssignment(assignmentId, studentId);
    }

    async createSubmission(data: CreateSubmissionInput, userId : string, file: Express.Multer.File | null) {
        const assignment = await this.assignmentService.getAssignmentById(data.assignmentId);
        if(!assignment){
            throw new ApiError(404, "Assignment does not exist");
        }

        if(userId !== data.studentId){
            throw new ApiError(403, "You are not authorized to submit for this student");
        }

        if(assignment.dueDate && new Date() > assignment.dueDate){
            throw new ApiError(400, "Cannot submit after the due date");
        }

        const student = await this.userService.getUserById(data.studentId);
        if(!student){
            throw new ApiError(404, "Student does not exist");
        }
        
        const enrollment = await this.enrollmentService.isStudentEnrolledInClass(data.studentId, assignment.classId);
        if(!enrollment){
            throw new ApiError(404, "Student is not enrolled in the class for this assignment");
        }

        let attachmentUrl: string | null = null;
        if(file) {
            attachmentUrl = await uploadToCloud(file, SupabaseConstants.submissionsBucket);
        }

        const newSubmission = await this.submissionsRepository.createSubmission(data, attachmentUrl || null);
        return newSubmission;

    }

    async updateSubmission(submissionId: string, data: Partial<CreateSubmissionInput>, userId : string, file: Express.Multer.File | null) {
        const submission = await this.submissionsRepository.getSubmissionById(submissionId);
        if(!submission){
            throw new ApiError(404, "Submission not found");
        }

        if(userId !== submission.studentId){
            throw new ApiError(403, "You are not authorized to update this submission");
        }

        if(submission.assignmentId !== data.assignmentId){
            throw new ApiError(400, "You cannot change the assignment for an existing submission");
        }

        const assignment = await this.assignmentService.getAssignmentById(submission.assignmentId);
        if(!assignment){
            throw new ApiError(404, "Assignment not found cannot update submission");
        }
        if(assignment.dueDate && new Date() > assignment.dueDate){
            throw new ApiError(400, "Cannot update submission after the due date");
        }

        let attachmentUrl: string | null = submission.attachmentUrl;
        if(file) {
            if(submission.attachmentUrl){
                await deleteFromCloud(submission.attachmentUrl, SupabaseConstants.submissionsBucket);
            }
            attachmentUrl = await uploadToCloud(file, SupabaseConstants.submissionsBucket);
        }

        const updatedSubmission = await this.submissionsRepository.updateSubmission(submissionId, data, attachmentUrl || null);
        return updatedSubmission;
    }

    async deleteSubmission(submissionId: string, userId : string) {
        const submission = await this.submissionsRepository.getSubmissionById(submissionId);
        if(!submission){
            throw new ApiError(404, "Submission not found");
        }

        const assignment = await this.assignmentService.getAssignmentById(submission.assignmentId);
        if(!assignment){
            throw new ApiError(404, "Assignment not found cannot delete submission");
        }
        if(assignment.dueDate && new Date() > assignment.dueDate){
            throw new ApiError(400, "Cannot delete submission after the due date");
        }
        if(userId !== submission.studentId){
            throw new ApiError(403, "You are not authorized to delete this submission");
        }
        if(submission.attachmentUrl){
            await deleteFromCloud(submission.attachmentUrl, SupabaseConstants.submissionsBucket);
        }

        await this.submissionsRepository.deleteSubmission(submissionId);
    }

}

