import { prisma } from "../db/prisma.js";


export class assignmentRepository {

    async getAssignments(){
        const assignments = await prisma.assignment.findMany({
            include:{
                class: true
            }
        })
        return assignments;
    }


    async getAssignmentById(assignmentId: string){
        const assignment = await prisma.assignment.findUnique({
            where:{
                assignmentId: assignmentId
            },
            include:{
                class: true
            }
        })
        return assignment;
    }


    async getAssignmentsByClassId(classId: string){
        const assignments = await prisma.assignment.findMany({
            where:{
                classId: classId
            },
            include:{
                class: true
            }
        })
        return assignments;
    }
    async deleteAssignment(assignmentId: string){
        const deletedAssignment = await prisma.assignment.delete({
            where:{
                assignmentId: assignmentId
            }
        })

        return deletedAssignment;
    }
}
