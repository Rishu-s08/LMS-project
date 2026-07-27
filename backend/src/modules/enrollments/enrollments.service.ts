import { roles } from "../../shared/constants/enums.js";
import { ApiError } from "../../shared/errors/api_error.js";
import { CacheKeyPrefix, cacheKeys, cacheManager } from "../../shared/utils/redis.utils.js";
import { ClassesService } from "../classes/classes.service.js";
import { UserService } from "../users/users.services.js";
import type { CreateEnrollmentInput } from "./enrollment.validation.js";
import { EnrollmentsRepository } from "./enrollments.repository.js";




export class EnrollmentsService {
    private readonly enrollmentsRepository: EnrollmentsRepository;
    private readonly userService: UserService;
    private readonly classesService: ClassesService;
    constructor(){
        this.enrollmentsRepository = new EnrollmentsRepository();
        this.userService = new UserService();
        this.classesService = new ClassesService();
    }

    async getEnrollmentById(enrollmentId: string) {
        const cachedEnrollment = await cacheManager.getJson(cacheKeys.enrollments(enrollmentId));
        if(cachedEnrollment != null){
            return cachedEnrollment;
        }
        const enrollment = await this.enrollmentsRepository.getEnrollmentById(enrollmentId);
        if(!enrollment) {
            throw new ApiError(404, `Enrollment not found.`);
        }
        await cacheManager.setJson(cacheKeys.enrollments(enrollmentId), enrollment);
        return enrollment;
    }

    async createEnrollment(data : CreateEnrollmentInput){
        const user = await this.userService.getUserById(data.studentId);
        if(!user || user.role !== roles.STUDENT){
            throw new ApiError(404, `User not found.`);
        }
        const classData = await this.classesService.getClassById(data.classId);
        if(!classData){
            throw new ApiError(404, "Class not found");
        }
        const existingEnrollment = await this.enrollmentsRepository.getStudentsByClassId(data.classId);
        const isAlreadyEnrolled = existingEnrollment.some(enrollment => enrollment.studentId === data.studentId);
        if(isAlreadyEnrolled){
            throw new ApiError(400, `Student is already enrolled in this class.`);
        }
        const newEnrollment = await this.enrollmentsRepository.createEnrollment(data);
        await cacheManager.invalidateByPattern(cacheManager.createCacheKey(CacheKeyPrefix.ENROLLMENTS, "*"));
        return newEnrollment;
    }

    async deleteEnrollment(enrollmentId: string) {
        const enrollment = await this.enrollmentsRepository.getEnrollmentById(enrollmentId);
        if(!enrollment) {
            throw new ApiError(404, `Enrollment not found.`);
        }
        await this.enrollmentsRepository.deleteEnrollment(enrollmentId);
        await cacheManager.invalidateByPattern(cacheManager.createCacheKey(CacheKeyPrefix.ENROLLMENTS, "*"));
    }

    async getStudentsByClassId(classId: string){
        const cachedStudents = await cacheManager.getJson(cacheKeys.enrollmentsByClass(classId));
        if(cachedStudents != null){
            return cachedStudents;
        }
        const classData = await this.classesService.getClassById(classId as string);
        if(!classData){
            throw new ApiError(404, "Class not found");
        }

        const students = await this.enrollmentsRepository.getStudentsByClassId(classId);
        await cacheManager.setJson(cacheKeys.enrollmentsByClass(classId), students);
        return students;
    }

    async getClassesByStudentId(studentId: string){
        const cachedClasses = await cacheManager.getJson(cacheKeys.enrollmentsByStudent(studentId));
        if(cachedClasses != null){
            return cachedClasses;
        }
        const user = await this.userService.getUserById(studentId);
        if(!user || user.role !== roles.STUDENT){
            throw new ApiError(404, `User not found.`);
        }
        const classes = await this.enrollmentsRepository.getClassesByStudentId(studentId);
        await cacheManager.setJson(cacheKeys.enrollmentsByStudent(studentId), classes);
        return classes;
    }

    async isStudentEnrolledInClass(studentId: string, classId: string) {
        const enrollment = await this.enrollmentsRepository.getEnrollmentByStudentAndClass(studentId, classId);
        return !!enrollment;
    }

}