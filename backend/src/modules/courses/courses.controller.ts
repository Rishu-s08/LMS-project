import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { CoursesService } from "./courses.service.js";



export class CoursesController {
    private readonly coursesService: CoursesService;

    constructor() {
        this.coursesService = new CoursesService();
    }

    getAllCourses = asyncHandler(async (req, res) => {
        const courses = await this.coursesService.getAllCourses();
        res.status(200).json({
            success: true,
            message: "Courses fetched successfully",
            data: courses
        });
    })

    getCourseById = asyncHandler(async (req, res) => {
        const courseId = req.params.courseId;
        const course = await this.coursesService.getCourseById(courseId as string);
        res.status(200).json({
            success: true,
            message: "Course fetched successfully",
            data: course
        });
    })

    getCourseByCode = asyncHandler(async (req, res) => {
        const courseCode = req.params.courseCode;
        const course = await this.coursesService.getCourseByCode(courseCode as string);
        res.status(200).json({
            success: true,
            message: "Course fetched successfully",
            data: course
        });
    })

    createCourse = asyncHandler(async (req, res) => {
        const courseData = req.body;
        const newCourse = await this.coursesService.createCourse(courseData);
        res.status(201).json({
            success: true,
            message: "Course created successfully",
            data: newCourse
        });
    })

    archiveCourse = asyncHandler(async (req, res) => {
        const courseId = req.params.courseId;
        const archivedCourse = await this.coursesService.archiveCourse(courseId as string);
        res.status(200).json({
            success: true,
            message: "Course archived successfully",
            data: archivedCourse
        });
    })

    unarchiveCourse = asyncHandler(async (req, res) => {
        const courseId = req.params.courseId;
        const unarchivedCourse = await this.coursesService.unarchiveCourse(courseId as string);
        res.status(200).json({
            success: true,
            message: "Course unarchived successfully",
            data: unarchivedCourse
        });
    })

    updateCourse = asyncHandler(async (req, res) => {
        const courseId = req.params.courseId;
        const updateData = req.body;
        const updatedCourse = await this.coursesService.updateCourse(courseId as string, updateData);
        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            data: updatedCourse
        });
    })
}