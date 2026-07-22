import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { AssignmentsService } from "./assignments.service.js";




export class AssignmentsController{
    private readonly assignmentService: AssignmentsService;
    constructor(){
        this.assignmentService = new AssignmentsService();
    }

    getAssignments = asyncHandler(async (req, res) => {
        const assignments = await this.assignmentService.getAssignments();
        res.status(200).json({
            success: true,
            message : "Assignments fetched successfully",
            data: assignments
        });
    })

    getAssignmentById = asyncHandler(async (req, res) => {
        const { assignmentId } = req.params;
        const assignment = await this.assignmentService.getAssignmentById(assignmentId as string);
        res.status(200).json({
            success: true,
            message : "Assignment fetched successfully",
            data: assignment
        });
    })

    getAssignmentsByClassId = asyncHandler(async (req, res) => {
        const { classId } = req.params;
        const assignments = await this.assignmentService.getAssignmentsByClassId(classId as string);
        res.status(200).json({
            success: true,
            message : "Assignments fetched successfully",
            data: assignments
        });
    })

    createAssignment = asyncHandler(async (req, res) => {
        const data = req.body;
        const attachmentUrl = req.file ? req.file : null;
        const newAssignment = await this.assignmentService.createAssignment(data, attachmentUrl);
        res.status(201).json({
            success: true,
            message : "Assignment created successfully",
            data: newAssignment
        });
    })

    deleteAssignment = asyncHandler(async (req, res) => {
        const { assignmentId } = req.params;
        await this.assignmentService.deleteAssignment(assignmentId as string);
        res.status(200).json({
            success: true,
            message : "Assignment deleted successfully"
        });
    })

    updateAssignment = asyncHandler(async (req, res) => {
        const { assignmentId } = req.params;
        const data = req.body;
        const attachmentUrl = req.file ? req.file : undefined;
        const updatedAssignment = await this.assignmentService.updateAssignment(assignmentId as string, data, attachmentUrl);
        res.status(200).json({
            success: true,
            message : "Assignment updated successfully",
            data: updatedAssignment
        });
    })
}
