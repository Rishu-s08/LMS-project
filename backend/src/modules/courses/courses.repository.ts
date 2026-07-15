import { prisma } from "../../db/prisma.js";
import type { CreateCourseInput } from "./courses.validation.js";



export class CoursesRepository {

    async getAllCourses() {
        const courses = await prisma.courses.findMany();
        return courses;
    }

    async getCourseById(courseId: string) {
        const course = await prisma.courses.findUnique({
            where: {
                courseId: courseId
            }
        });
        return course;
    }

    async getCourseByCode(courseCode: string) {
        const course = await prisma.courses.findUnique({
            where: {
                code: courseCode
            }
        });
        return course;
    }

    async createCourse(data: CreateCourseInput) {
        const newCourse = await prisma.courses.create({
            data
        });
        return newCourse;
    }

    async archiveCourse(courseId: string) {
        const archivedCourse = await prisma.courses.update({
            where: {
                courseId: courseId
            },
            data: {
                isArchived: true
            }
        });
        return archivedCourse;
    }

    async unarchiveCourse(courseId: string) {
        const unarchivedCourse = await prisma.courses.update({
            where: {
                courseId: courseId
            },
            data: {
                isArchived: false
            }
        });
        return unarchivedCourse;
    }

    async updateCourse(courseId: string, data: Partial<CreateCourseInput>) {
        const updatedCourse = await prisma.courses.update({
            where: {
                courseId: courseId
            },
            data
        });
        return updatedCourse;
    }

}

