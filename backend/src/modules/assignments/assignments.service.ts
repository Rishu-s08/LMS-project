import { ApiError } from "../../shared/errors/api_error.js";
import { ClassesService } from "../classes/classes.service.js";
import { assignmentRepository } from "./assignments.repository.js";
import type { CreateAssignmentInput } from "./assignments.validation.js";
import { deleteFromCloud, uploadToCloud } from "./supabase.util.js";

export class AssignmentsService{
    private readonly assignmentsRepository: assignmentRepository;
    private readonly classesService: ClassesService;

    constructor(){
        this.assignmentsRepository = new assignmentRepository();
        this.classesService = new ClassesService();
    }

    async getAssignments(){
        const assignments = await this.assignmentsRepository.getAssignments();
        return assignments;
    }

    async getAssignmentById(assignmentId: string){
        const assignment = await this.assignmentsRepository.getAssignmentById(assignmentId);
        if(!assignment){
            throw new ApiError(404, `Assignment not found.`);
        }
        return assignment;
    }

    async getAssignmentsByClassId(classId: string){
        const classData = await this.classesService.getClassById(classId);
        if(!classData){
            throw new ApiError(404, "Class not found");
        }
        const assignments = await this.assignmentsRepository.getAssignmentsByClassId(classId);
        return assignments;
    }

    async createAssignment(data: CreateAssignmentInput, file: Express.Multer.File | null){
        const classData = await this.classesService.getClassById(data.classId);
        if (!classData) {
            throw new ApiError(404, "Class not found");
        }

        const isDueDateValid = data.dueDate > new Date();
        if (!isDueDateValid) {
            throw new ApiError(400, "Due date must be in the future");
        }

        let attachmentUrl: string | null = null;
        if (file) {
            attachmentUrl = await uploadToCloud(file);
        }

        const assignment = await this.assignmentsRepository.createAssignment(data, attachmentUrl);
        return assignment;
    } 


    // Handles conditional updates: uploads a replacement file if passed, otherwise leaves existing path
    async updateAssignment(assignmentId: string, data: Partial<CreateAssignmentInput>, file?: Express.Multer.File) {
        const assignment = await this.assignmentsRepository.getAssignmentById(assignmentId);
        if (!assignment) {
            throw new ApiError(404, `Assignment not found.`);
        }
        const dueDate = data.dueDate || assignment.dueDate; // Use existing dueDate if not provided
        const isDueDateValid = dueDate > new Date();
        if (!isDueDateValid) {
            throw new ApiError(400, "Due date must be in the future or cannot make changes in Assignment after the deadline is passed");
        }
        
        if (data.classId) {
            const classData = await this.classesService.getClassById(data.classId);
            if (!classData) {
                throw new ApiError(404, "Class not found");
            }
        }

        let attachmentUrl: string | null = assignment.attachmentUrl;
        let newAttachmentUrl: string | null = assignment.attachmentUrl;

        if (file) {
            newAttachmentUrl = await uploadToCloud(file);
            
            if(attachmentUrl){
                await deleteFromCloud(attachmentUrl);
            }

            // Optional optimization tip: You could call supabase.storage.from().remove() here 
            // on assignment.attachmentUrl path to wipe the old file out of the cloud!
        }

        const updatedAssignment = await this.assignmentsRepository.updateAssignment(assignmentId, data, newAttachmentUrl);
        return updatedAssignment;
    }

    async deleteAssignment(assignmentId: string){
        const assignment = await this.assignmentsRepository.getAssignmentById(assignmentId);
        if(!assignment){
            throw new ApiError(404, `Assignment not found.`);
        }
        const deletedAssignment = await this.assignmentsRepository.deleteAssignment(assignmentId);
        if(assignment.attachmentUrl){
            await deleteFromCloud(assignment.attachmentUrl);
        }
        return deletedAssignment;
    }
}

