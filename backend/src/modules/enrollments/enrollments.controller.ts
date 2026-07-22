import { ApiError } from "../../shared/errors/api_error.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { EnrollmentsService } from "./enrollments.service.js";



export class EnrollmentsController {
    private readonly enrollmentsService: EnrollmentsService;
    constructor() {
        this.enrollmentsService = new EnrollmentsService();
    }

    // Noone needing this no need to fetch all relations
    // getAllEnrollments = asyncHandler(async (req, res) => {
    //     const enrollments = await this.enrollmentsService.getAllEnrollments();
    //     res.status(200).json({
    //         success: true,
    //         message : "Enrollments fetched successfully",
    //         data: enrollments
    //     });
    // })

    getEnrollmentById = asyncHandler(async (req, res) => {
        const { enrollmentId } = req.params;
        const enrollment = await this.enrollmentsService.getEnrollmentById(enrollmentId as string);
        res.status(200).json({
            success: true,
            message : "Enrollment fetched successfully",
            data: enrollment
        });
    })

    createEnrollment = asyncHandler(async (req, res) => {
        const data = req.body;
        const newEnrollment = await this.enrollmentsService.createEnrollment(data);
        res.status(201).json({
            success: true,
            message : "Enrollment created successfully",
            data: newEnrollment
        });
    })

    // NO updation needed for enrollment, as it is just a mapping between student and class. If we need to change the student or class, we can delete the enrollment and create a new one.

    // updateEnrollment = asyncHandler(async (req, res) => {
    //     const { enrollmentId } = req.params;
    //     const enrollment = await this.enrollmentsService.getEnrollmentById(enrollmentId as string);
    //     if(!enrollment) {
    //         throw new ApiError(404, `Enrollment not found.`);
    //     }
    //     const updatedEnrollment = await this.enrollmentsService.updateEnrollment(enrollmentId as string, req.body);
    //     res.status(200).json({
    //         success: true,
    //         message : "Enrollment updated successfully",
    //         data: updatedEnrollment
    //     });
    // })

    deleteEnrollment = asyncHandler(async (req, res) => {
        const { enrollmentId } = req.params;
        await this.enrollmentsService.deleteEnrollment(enrollmentId as string);
        res.status(200).json({
            success: true,
            message : "Enrollment deleted successfully",
        });
    })

    getAllClassesByStudentId = asyncHandler(async (req, res) => {
        const { studentId } = req.params;
        const classes = await this.enrollmentsService.getClassesByStudentId(studentId as string);
        res.status(200).json({
            success: true,
            message : "Classes fetched successfully",
            data: classes
        });
    })

    getAllStudentsByClassId = asyncHandler(async (req, res) => {
        const { classId } = req.params;
        const students = await this.enrollmentsService.getStudentsByClassId(classId as string);
        res.status(200).json({
            success: true,
            message : "Students fetched successfully",
            data: students
        });
    })

}
