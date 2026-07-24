
import { z } from 'zod';

export const submissionSchema = z.object({
    assignmentId : z.uuid("Invalid assignmentId format").describe("The ID of the assignment to which the submission belongs"),
    studentId : z.uuid("Invalid studentId format").describe("The ID of the student who made the submission"),
    note : z.string().max(500, "Note must be at most 500 characters long").optional().nullable().default(null).describe("An optional note or comment about the submission"),

    file: z.object({
        fieldname: z.literal('attachment'),
        size: z.number().max(10 * 1024 * 1024, "File cannot exceed 10MB"),
        mimetype: z.string().refine(
          (type) => ['application/pdf', 'image/jpeg', 'image/png'].includes(type),
          "Only PDFs and Images are allowed"
        )
      }).optional()
})

export const submissionIdParam = z.object({
    submissionId : z.uuid("Invalid submissionId format").describe("The ID of the submission"),
})

export const assignmentIdParam = z.object({
    assignmentId : z.uuid("Invalid assignmentId format").describe("The ID of the assignment"),
})

export const studentIdParam = z.object({
    studentId : z.uuid("Invalid studentId format").describe("The ID of the student"),
})

export const updateSubmissionSchema = submissionSchema.partial().refine(
    (data) => Object.keys(data).length > 0, 
    { message: "You must provide at least one field to update" }
);

export type CreateSubmissionInput = z.infer<typeof submissionSchema>;
export type SubmissionIdParamInput = z.infer<typeof submissionIdParam>;
export type AssignmentIdParamInput = z.infer<typeof assignmentIdParam>;
export type StudentIdParamInput = z.infer<typeof studentIdParam>;
export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>;

