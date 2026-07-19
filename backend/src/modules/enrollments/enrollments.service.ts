import { roles } from "../../shared/constants/enums.js";
import { ApiError } from "../../shared/errors/api_error.js";
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
        const enrollment = await this.enrollmentsRepository.getEnrollmentById(enrollmentId);
        return enrollment;
    }

    async createEnrollment(data : CreateEnrollmentInput){
        const newEnrollment = await this.enrollmentsRepository.createEnrollment(data);
        return newEnrollment;
    }

    async deleteEnrollment(enrollmentId: string) {
        const enrollment = await this.enrollmentsRepository.getEnrollmentById(enrollmentId);
        if(!enrollment) {
            throw new ApiError(404, `Enrollment not found.`);
        }
        await this.enrollmentsRepository.deleteEnrollment(enrollmentId);
    }

    async getStudentsByClassId(classId: string){
        const classData = await this.classesService.getClassById(classId as string);
        if(!classData){
            throw new ApiError(404, "Class not found");
        }

        const students = await this.enrollmentsRepository.getStudentsByClassId(classId);
        return students;
    }

    async getClassesByStudentId(studentId: string){
        const user = await this.userService.getUserById(studentId);
        if(!user || user.role !== roles.STUDENT){
            throw new ApiError(404, `User not found.`);
        }
        const classes = await this.enrollmentsRepository.getClassesByStudentId(studentId);
        return classes;
    }

}