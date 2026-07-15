import { ApiError } from "../../shared/errors/api_error.js";
import { CoursesRepository } from "./courses.repository.js";
import type { CreateCourseInput } from "./courses.validation.js";



export class CoursesService {
    private readonly coursesRepository: CoursesRepository;

    constructor() {
        this.coursesRepository = new CoursesRepository();
    }

    async getAllCourses() {
        return await this.coursesRepository.getAllCourses();
    }

    async getCourseById(courseId: string) {
        const course = await this.coursesRepository.getCourseById(courseId);
        if (!course) {
            throw new ApiError(404, `Course with ID ${courseId} not found.`);
        }
        return course;
    }

    async getCourseByCode(courseCode: string) {
        const course =  await this.coursesRepository.getCourseByCode(courseCode);
        if (!course) {
            throw new ApiError(404, `Course with code ${courseCode} not found.`);
        }
        return course;
    }

    async createCourse(data: CreateCourseInput) {
        return await this.coursesRepository.createCourse(data);
    }

    async archiveCourse(courseId: string) {
        const course = await this.coursesRepository.getCourseById(courseId);
        if (!course) {
            throw new ApiError(404, `Course with ID ${courseId} not found.`);
        }
        return await this.coursesRepository.archiveCourse(courseId);
    }

    async unarchiveCourse(courseId: string) {
        const course = await this.coursesRepository.getCourseById(courseId);
        if (!course) {
            throw new ApiError(404, `Course with ID ${courseId} not found.`);
        }
        return await this.coursesRepository.unarchiveCourse(courseId);
    }

    async updateCourse(courseId: string, data: Partial<CreateCourseInput>) {
        const course = await this.coursesRepository.getCourseById(courseId);
        if (!course) {
            throw new ApiError(404, `Course with ID ${courseId} not found.`);
        }
        return await this.coursesRepository.updateCourse(courseId, data);
    }
}
