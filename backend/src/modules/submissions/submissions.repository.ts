import { prisma } from "../../db/prisma.js";
import type { CreateSubmissionInput } from "./submissions.validation.js";



export class SubmissionsRepository {

    async getAllSubmissionsForAssignment(assignmentId: string) {
        const submissions = await prisma.submission.findMany({
            where : {
                assignmentId : assignmentId
            }
        })

        return submissions;
    }

    async getSubmissionById(submissionId: string) {
        const submission = await prisma.submission.findUnique({
            where : {
                submissionId : submissionId
            }
        })
        return submission;
    }

    async getMySubmissionsForAssignment(assignmentId: string, studentId: string) {
        const submissions = await prisma.submission.findUnique({
            where : {
                assignmentId_studentId : {
                    assignmentId : assignmentId,
                    studentId : studentId
                },
            }
        })
        return submissions;
    }

    async createSubmission(data: CreateSubmissionInput, attachmentUrl: string | null) {
        const newSubmission = await prisma.submission.create({
            data: {
                ...data,
                attachmentUrl
            }
        })
        return newSubmission;
    }

    async updateSubmission(submissionId: string, data: Partial<CreateSubmissionInput>, attachmentUrl: string | null) {
        const updatedSubmission = await prisma.submission.update({
            where: {
                submissionId: submissionId
            },
            data: {
                ...data,
                attachmentUrl
            }
        })
        return updatedSubmission;
    }

    async deleteSubmission(submissionId: string) {
        const deletedSubmission = await prisma.submission.delete({
            where: {
                submissionId: submissionId
            }
        })
        return deletedSubmission;
    }

}

