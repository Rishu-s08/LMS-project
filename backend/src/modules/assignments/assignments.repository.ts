import { prisma } from "../../db/prisma.js"
import type { CreateAssignmentInput } from "./assignments.validation.js";




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


    async createAssignment(data: CreateAssignmentInput, assignmentUrl : string | null){
        const newAssignment = await prisma.assignment.create({
            data: {
                ...data,
                attachmentUrl: assignmentUrl
            }
        })
        return newAssignment;
    }

    async updateAssignment(assignmentId : string, data: Partial<CreateAssignmentInput>, assignmentUrl : string | null){
        const updatedAssignment = await prisma.assignment.update({
            where:{
                assignmentId: assignmentId
            },
            data: {
                ...data,
                attachmentUrl: assignmentUrl
            }
        })

        return updatedAssignment;
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
