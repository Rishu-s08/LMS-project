import { ApiError } from "../../shared/errors/api_error.js";
import { logger } from "../../shared/utils/logger.util.js";
import { CacheKeyPrefix, cacheKeys, cacheManager } from "../../shared/utils/redis.utils.js";
import { CoursesRepository } from "./courses.repository.js";
import type { CreateCourseInput } from "./courses.validation.js";



export class CoursesService {
    private readonly coursesRepository: CoursesRepository;

    constructor() {
        this.coursesRepository = new CoursesRepository();
    }

    async getAllCourses() {
        const cachedCourses = await cacheManager.getJson(cacheKeys.courses());
        if(cachedCourses != null){
            return cachedCourses;
        }
        const courses = await this.coursesRepository.getAllCourses();
        await cacheManager.setJson(cacheKeys.courses(), courses);
        return courses;
    }

    async getCourseById(courseId: string) {
        const cachedCourse = await cacheManager.getJson(cacheKeys.course(courseId));
        if(cachedCourse != null){
            return cachedCourse;
        }
        const course = await this.coursesRepository.getCourseById(courseId);
        if (!course) {
            throw new ApiError(404, `Course not found.`);
        }
        await cacheManager.setJson(cacheKeys.course(courseId), course);
        return course;
    }

    async getCourseByCode(courseCode: string) {
        const cachedCourse = await cacheManager.getJson(cacheKeys.courseByCode(courseCode));
        if(cachedCourse != null){
            return cachedCourse;
        }
        const course =  await this.coursesRepository.getCourseByCode(courseCode);
        if (!course) {
            throw new ApiError(404, `Course with code ${courseCode} not found.`);
        }
        await cacheManager.setJson(cacheKeys.courseByCode(courseCode), course);
        return course;
    }

    async createCourse(data: CreateCourseInput) {
        const newCourse = await this.coursesRepository.createCourse(data);
        await cacheManager.invalidateByPattern(cacheManager.createCacheKey(CacheKeyPrefix.COURSES, "*"));
        logger.info({ courseId: newCourse.courseId, code: newCourse.code }, "Course created");
        return newCourse;
    }

    async archiveCourse(courseId: string) {
        const course = await this.coursesRepository.getCourseById(courseId);
        if (!course) {
            throw new ApiError(404, `Course with ID ${courseId} not found.`);
        }

        const archivedCourse = await this.coursesRepository.archiveCourse(courseId);
        await cacheManager.invalidateByPattern(cacheManager.createCacheKey(CacheKeyPrefix.COURSES, "*"));
        return archivedCourse;
    }

    async unarchiveCourse(courseId: string) {
        const course = await this.coursesRepository.getCourseById(courseId);
        if (!course) {
            throw new ApiError(404, `Course with ID ${courseId} not found.`);
        }
        const unarchivedCourse = await this.coursesRepository.unarchiveCourse(courseId);
        await cacheManager.invalidateByPattern(cacheManager.createCacheKey(CacheKeyPrefix.COURSES, "*"));
        return unarchivedCourse;
    }

    async updateCourse(courseId: string, data: Partial<CreateCourseInput>) {
        const course = await this.coursesRepository.getCourseById(courseId);
        if (!course) {
            throw new ApiError(404, `Course with ID ${courseId} not found.`);
        }
        const updatedCourse = await this.coursesRepository.updateCourse(courseId, data);
        await cacheManager.invalidateByPattern(cacheManager.createCacheKey(CacheKeyPrefix.COURSES, "*"));
        return updatedCourse;
    }
}
