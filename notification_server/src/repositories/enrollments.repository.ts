import { prisma } from "../db/prisma.js";

export class EnrollmentsRepository{


    async getEnrollmentById(enrollmentId: string){
        const enrollment = await prisma.enrollment.findUnique({
            where:{
                enrollmentId: enrollmentId
            },
            include:{
                student: true,
                class: true
            }
        });
        return enrollment;
    }

    async deleteEnrollment(enrollmentId: string){
        await prisma.enrollment.delete({
            where:{
                enrollmentId: enrollmentId
            }
        });
    }

    async getStudentsByClassId(classId: string){
        const students = await prisma.enrollment.findMany({
            where:{
                classId: classId
            },
            include:{
                student: true
            }
        });
        return students;
    }

    async getClassesByStudentId(studentId: string){
        const classes = await prisma.enrollment.findMany({
            where:{
                studentId: studentId
            },
            include:{
                class: true
            }
        });
        return classes;
    }

    async getEnrollmentByStudentAndClass(studentId: string, classId: string) {
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                studentId: studentId,
                classId: classId
            }
        });
        return enrollment;
    }
}