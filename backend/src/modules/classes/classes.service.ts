import { roles } from "../../shared/constants/enums.js";
import { ApiError } from "../../shared/errors/api_error.js";
import { CoursesService } from "../courses/courses.service.js";
import { UserService } from "../users/users.services.js";
import { ClassesRepository } from "./classes.repository.js";
import type { CreateClassInput, UpdateClassInput } from "./classes.validation.js";


export class ClassesService {
    private readonly classesRepository: ClassesRepository;
    private readonly userService: UserService;
    private readonly courseService: CoursesService;

    constructor() {
        this.classesRepository = new ClassesRepository();
        this.userService = new UserService();
        this.courseService = new CoursesService();
    }

    async getAllClasses() {
        const classes = await this.classesRepository.getAllClasses();
        return classes;
    }

    async getClassById(classId: string) {
        const classData = await this.classesRepository.getClassById(classId);
        return classData;
    }

    async createClass(data: CreateClassInput) {
        // check if the faculty exists and is not a student
        const faculty = await this.userService.getUserById(data.facultyId);
        if(faculty?.role === roles.STUDENT) {
            throw new ApiError(400, `User with ID ${data.facultyId} is not a faculty member.`);
        }

        // check if the course exists
        await this.courseService.getCourseById(data.courseId);
        const newClass = await this.classesRepository.createClass(data);
        return newClass;
    }

    async getClassesByFacultyId(facultyId: string) {
        const classes = await this.classesRepository.getClassesByFacultyId(facultyId);
        return classes;
    }

    async getFaculty(facultyId: string) {
        const faculty = await this.userService.getUserById(facultyId);
        if(!faculty || faculty?.role === roles.STUDENT) {
            throw new ApiError(400, `User with ID ${facultyId} is not a faculty member.`);
        }
        return faculty;
    }

    async archiveClass(classId: string) {
        const classData = await this.classesRepository.getClassById(classId);
        if (!classData) {
            throw new ApiError(404, `Class with ID ${classId} not found.`);
        }
        return await this.classesRepository.archiveClass(classId);
    }

    async unarchiveClass(classId: string) {
        const classData = await this.classesRepository.getClassById(classId);
        if (!classData) {
            throw new ApiError(404, `Class with ID ${classId} not found.`);
        }
        return await this.classesRepository.unarchiveClass(classId);
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
        return await this.classesRepository.updateClass(classId, data);
    }
}
