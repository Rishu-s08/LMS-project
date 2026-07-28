import { publishEvent } from "../../config/rabbitmq.js";
import { routingKeys } from "../../shared/constants/constants.js";
import { roles } from "../../shared/constants/enums.js";
import { ApiError } from "../../shared/errors/api_error.js";
import { CacheKeyPrefix, cacheKeys, cacheManager } from "../../shared/utils/redis.utils.js";
import { CoursesService } from "../courses/courses.service.js";
import { EnrollmentsService } from "../enrollments/enrollments.service.js";
import { UserService } from "../users/users.services.js";
import { ClassesRepository } from "./classes.repository.js";
import type { CreateClassInput, UpdateClassInput } from "./classes.validation.js";


export class ClassesService {
    private readonly classesRepository: ClassesRepository;
    private readonly userService: UserService;
    private readonly courseService: CoursesService;
    private readonly enrollmentsService: EnrollmentsService;

    constructor() {
        this.classesRepository = new ClassesRepository();
        this.userService = new UserService();
        this.courseService = new CoursesService();
        this.enrollmentsService = new EnrollmentsService();
    }

    async getAllClasses() {

        const cachedClasses = await cacheManager.getJson(cacheKeys.classes());
        if(cachedClasses != null){
            return cachedClasses;
        }

        const classes = await this.classesRepository.getAllClasses();
        await cacheManager.setJson(cacheKeys.classes(), classes);
        return classes;
    }

    async getClassById(classId: string) {
        const cachedClass = await cacheManager.getJson(cacheKeys.class(classId));
        if(cachedClass != null){
            return cachedClass;
        }
        const classData = await this.classesRepository.getClassById(classId);
        await cacheManager.setJson(cacheKeys.class(classId), classData);
        return classData;
    }

    async createClass(data: CreateClassInput) {
        // check if the faculty exists and is not a student
        const faculty = await this.userService.getUserById(data.facultyId);
        if(faculty?.role === roles.STUDENT) {
            throw new ApiError(400, `User is not a faculty member.`);
        }

        // check if the course exists
        await this.courseService.getCourseById(data.courseId);

        const newClass = await this.classesRepository.createClass(data);
        await cacheManager.invalidateByPattern(cacheManager.createCacheKey(CacheKeyPrefix.CLASSES, "*"));
        
        await this.enrollmentsService.createEnrollmentWithAllStudentsBelongsToSameSemAndBranch(data.semester, data.branch, newClass.classId);

        await publishEvent(routingKeys.classroomCreated, {
            classId: newClass.classId,
        })

        return newClass;
    }

    async getClassesByFacultyId(facultyId: string) {
        const cachedClasses = await cacheManager.getJson(cacheKeys.classesByFaculty(facultyId));
        if(cachedClasses != null){
            return cachedClasses;
        }

        const classes = await this.classesRepository.getClassesByFacultyId(facultyId);
        await cacheManager.setJson(cacheKeys.classesByFaculty(facultyId), classes);
        return classes;
    }

    async getFaculty(facultyId: string) {
        const faculty = await this.userService.getUserById(facultyId);
        if(!faculty || faculty?.role === roles.STUDENT) {
            throw new ApiError(400, `User is not a faculty member.`);
        }
        return faculty;
    }

    async archiveClass(classId: string) {
        const classData = await this.classesRepository.getClassById(classId);
        if (!classData) {
            throw new ApiError(404, `Class with ID ${classId} not found.`);
        }
        const data = await this.classesRepository.archiveClass(classId);
        await cacheManager.invalidateByPattern(cacheManager.createCacheKey(CacheKeyPrefix.CLASSES, "*"));
        return data;
    }

    async unarchiveClass(classId: string) {
        const classData = await this.classesRepository.getClassById(classId);
        if (!classData) {
            throw new ApiError(404, `Class with ID ${classId} not found.`);
        }
        const data = await this.classesRepository.unarchiveClass(classId);
        await cacheManager.invalidateByPattern(cacheManager.createCacheKey(CacheKeyPrefix.CLASSES, "*"));
        return data;
    }


    async updateClass(classId: string, data: Partial<CreateClassInput>){
        if(data.facultyId) {
            // check if the faculty exists and is not a student
            const faculty = await this.userService.getUserById(data.facultyId);
            if(faculty?.role === roles.STUDENT) {
                throw new ApiError(400, `User with ID ${data.facultyId} is not a faculty member.`);
            }
        }

        if(data.courseId){     
            // check if the course exists
            await this.courseService.getCourseById(data.courseId);
        }
        const updatedClass = await this.classesRepository.updateClass(classId, data);
        await cacheManager.invalidateByPattern(cacheManager.createCacheKey(CacheKeyPrefix.CLASSES, "*"));
        return updatedClass;
    }
}
