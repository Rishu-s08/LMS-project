import { prisma } from "../../db/prisma.js";
import type { CreateClassInput, UpdateClassInput } from "./classes.validation.js";


export class ClassesRepository {

    async getClassById(classId: string) {
        const classData = await prisma.classes.findUnique({
            where: {
                classId: classId
            }
        });
        return classData;
    }

    async getAllClasses() {
        const classes = await prisma.classes.findMany();
        return classes;
    }

    async getClassesByFacultyId(facultyId: string) {
        const classes = await prisma.classes.findMany({
            where: {
                facultyId: facultyId
            }
        });
        return classes;
    }

    // async getClassesByStudentId(studentId: string) {
    //     const classes = await prisma.enrollment.findMany({
    //         where: {
    //             studentId: studentId
    //         },
    //         include: {
    //             class: true
    //         }
    //     });
    //     return classes.map(enrollment => enrollment.class);
    // }

    async createClass(data: CreateClassInput) {
        const newClass = await prisma.classes.create({
            data
        });
        return newClass;
    }

    async updateClass(classId: string, data: Partial<CreateClassInput>) {
        const updatedClass = await prisma.classes.update({
            where: {
                classId: classId
            },
            data
        });
        return updatedClass;
    }

    async archiveClass(classId: string) {
        const archivedClass = await prisma.classes.update({
            where: {
                classId: classId
            },
            data : {
                isArchived: true
            }
        });
        return archivedClass;
    }

    async unarchiveClass(classId: string) {
        const unarchivedClass = await prisma.classes.update({
            where: {
                classId: classId
            },
            data : {
                isArchived: false
            }
        });
        return unarchivedClass;
    }

}