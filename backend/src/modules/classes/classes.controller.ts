import { ApiError } from "../../shared/errors/api_error.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ClassesService } from "./classes.service.js";


export class ClassesController {
    private readonly classesService: ClassesService;

    constructor() {
        this.classesService = new ClassesService();
    }

    getAllClasses = asyncHandler(async (req, res) => {
        const classes = await this.classesService.getAllClasses();
        res.status(200).json({
            success: true,
            message : "Classes fetched successfully",
            data: classes
        });
    })

    getClassById = asyncHandler(async (req, res) => {
        const { classId } = req.params;
        const classData = await this.classesService.getClassById(classId as string);
        if(!classData) {
            throw new ApiError(404, `Class with ID ${classId} not found.`);
        }
        res.status(200).json({
            success: true,
            message : "Class fetched successfully",
            data: classData
        });
    })

    createClass = asyncHandler(async (req, res) => {
        const classData = req.body;
        const newClass = await this.classesService.createClass(classData);
        res.status(201).json({
            success: true,
            message : "Class created successfully",
            data: newClass
        });
    })

    getClassesByFacultyId = asyncHandler(async (req, res) => {
        const { facultyId } = req.params;
        const faculty = await this.classesService.getFaculty(facultyId as string);
        if(!faculty) {
            throw new ApiError(404, `Faculty with ID ${facultyId} not found.`);
        }
        const classes = await this.classesService.getClassesByFacultyId(facultyId as string);
        res.status(200).json({
            success: true,
            message : "Classes fetched successfully",
            data: classes
        });
    })

    archiveClass = asyncHandler(async (req, res) => {
        const { classId } = req.params;
        const classData = await this.classesService.getClassById(classId as string);
        if(!classData) {
            throw new ApiError(404, `Class with ID ${classId} not found.`);
        }
        const archivedClass = await this.classesService.archiveClass(classId as string);
        res.status(200).json({
            success: true,
            message : "Class archived successfully",
            data: archivedClass
        });
    })

    unarchiveClass = asyncHandler(async (req, res) => {
        const { classId } = req.params;
        const classData = await this.classesService.getClassById(classId as string);
        if(!classData) {
            throw new ApiError(404, `Class with ID ${classId} not found.`);
        }
        const unarchivedClass = await this.classesService.unarchiveClass(classId as string);
        res.status(200).json({
            success: true,
            message : "Class unarchived successfully",
            data: unarchivedClass
        });
    })

    getFacultyOfClass = asyncHandler(async (req, res) => {
        const { classId } = req.params;
        const classData = await this.classesService.getClassById(classId as string);

        if(!classData) {
            throw new ApiError(404, `Class with ID ${classId} not found.`);
        }

        const facultyId = classData?.facultyId;
        res.status(200).json({
            success: true,
            message : "Faculty of the class fetched successfully",
            data: facultyId
        });
    })


    getCourseOfClass = asyncHandler(async (req, res) => {
        const { classId } = req.params;
        const classData = await this.classesService.getClassById(classId as string);
        if(!classData) {
            throw new ApiError(404, `Class with ID ${classId} not found.`);
        }
        const courseId = classData?.courseId;
        res.status(200).json({
            success: true,
            message : "Course of the class fetched successfully",
            data: courseId
        });
    })

    updateClass = asyncHandler(async (req, res) => {
        const {classId} = req.params;
        const classData = await this.classesService.getClassById(classId as string);
        if(!classData) {
            throw new ApiError(404, `Class with ID ${classId} not found.`);
        }
        const updatedData = req.body;
        const updatedClass = await this.classesService.updateClass(classId as string, updatedData);
        res.status(200).json({
            success: true,
            message : "Class updated successfully",
            data: updatedClass
        });
    })

}