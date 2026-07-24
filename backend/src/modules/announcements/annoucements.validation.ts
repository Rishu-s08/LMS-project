import {z} from "zod";

export const createAnnouncementSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title must be at most 100 characters").describe("The title of the announcement"),
    content: z.string().min(1, "Content is required").max(1000, "Content must be at most 1000 characters").describe("The content of the announcement"),
    classId: z.uuid("Class ID must be a valid UUID").describe("The ID of the class to which the announcement belongs"),
    // Optional field for attachments
    // we will implement later
    file: z.object({
        fieldname: z.literal('attachment'),
        size: z.number().max(10 * 1024 * 1024, "File cannot exceed 10MB"),
        mimetype: z.string().refine(
          (type) => ['application/pdf', 'image/jpeg', 'image/png'].includes(type),
          "Only PDFs and Images are allowed"
        )
      }).optional() // Set to .optional() since your Prisma schema has attachmentUrl String?
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial().refine(
    (data) => Object.keys(data).length > 0, 
    { message: "You must provide at least one field to update" }
);

export const announcementIdParam = z.object({
    announcementId: z.uuid("Announcement ID must be a valid UUID").describe("The ID of the announcement"),
});

export const classIdParam = z.object({
    classId: z.uuid("Class ID must be a valid UUID").describe("The ID of the class"),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
export type AnnouncementIdParamInput = z.infer<typeof announcementIdParam>;
export type ClassIdParamInput = z.infer<typeof classIdParam>;