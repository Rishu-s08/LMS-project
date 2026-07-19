import {z} from "zod";

export const CreateEnrollmentSchema = z.object({
    studentId : z.uuid().describe("Id of the student enrolling in the class"),
    classId : z.uuid().describe("Id of the class the student is enrolling in"),
})

export const enrollmentIdParamSchema = z.object({
    enrollmentId : z.uuid("Invalid enrollment ID format"),
})

export const studentIdParamSchema = z.object({
    studentId : z.uuid("Invalid student ID format"),
})

export const classIdParamSchema = z.object({
    classId : z.uuid("Invalid class ID format"),
})

export type CreateEnrollmentInput = z.infer<typeof CreateEnrollmentSchema>;
export type EnrollmentIdParamInput = z.infer<typeof enrollmentIdParamSchema>;
export type StudentIdParamInput = z.infer<typeof studentIdParamSchema>;
export type ClassIdParamInput = z.infer<typeof classIdParamSchema>;