

import {z} from "zod";
import { de } from "zod/locales";

export const createResourceSchema = z.object({
    title: z.string().min(4, "Title is required").describe("Title of the resource").max(100, "Title should not exceed 100 characters"),
    description : z.string().optional().nullable().default(null).describe("Description of the resource"),
    classId : z.uuid("Not a valid UUID").describe("Class ID to which the resource belongs"),

    file: z.object({
        fieldname: z.literal('attachment'),
        size: z.number().max(10 * 1024 * 1024, "File cannot exceed 10MB"),
        mimetype: z.string().refine(
          (type) => ['application/pdf', 'image/jpeg', 'image/png'].includes(type),
          "Only PDFs and Images are allowed"
        )
      }).optional()
})

export const resourceIdParam = z.object({
    resourceId : z.uuid("Not a valid UUID").describe("ID of the resource"),
})

export const classIdParam = z.object({
    classId : z.uuid("Not a valid UUID").describe("ID of the class"),
})

export const updateResourceSchema = createResourceSchema.partial().refine(
    (data) => Object.keys(data).length > 0, 
    { message: "You must provide at least one field to update" }
);

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type ResourceIdParamInput = z.infer<typeof resourceIdParam>;
export type ClassIdParamInput = z.infer<typeof classIdParam>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
