import z from "zod";




export const createAssignmentSchema = z.object({
    title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters").describe("Title of the assignment"),
    description: z.string().nullable().default(null).describe("Description of the assignment"),
    // dueDate : z.date("Invalid date format").describe("Due date of the assignment in ISO 8601 format"),
        //  FIX: Coerce the incoming Flutter string into a native JavaScript Date object
    dueDate: z.preprocess((val) => {
      if (typeof val === 'string') {
        const parsedDate = Date.parse(val);
        // If it's a valid date string format, return a new Date object
        if (!isNaN(parsedDate)) return new Date(parsedDate);
      }
      return val;
    }, z.date({ message: "Invalid date format" })), // Assures Prisma receives a real Date object

    classId : z.uuid("Invalid class ID format").describe("ID of the class to which the assignment belongs"),
    isPublished : z.boolean().optional().default(true).describe("Whether the assignment is published or not"),

    file: z.object({
    fieldname: z.literal('attachment'),
    size: z.number().max(10 * 1024 * 1024, "File cannot exceed 10MB"),
    mimetype: z.string().refine(
      (type) => ['application/pdf', 'image/jpeg', 'image/png'].includes(type),
      "Only PDFs and Images are allowed"
    )
  }).optional() // Set to .optional() since your Prisma schema has attachmentUrl String?
})


export const assignmentIdParam = z.object({
    assignmentId : z.uuid("Invalid assignment ID format").describe("ID of the assignment"),
})

export const classIdParam = z.object({
    classId : z.uuid("Invalid class ID format").describe("ID of the class"),
})

// The requirements for UPDATING a post (All fields become optional automatically!)
export const updateAssignmentSchema = createAssignmentSchema.partial().refine(
  (data) => Object.keys(data).length > 0, 
  { message: "You must provide at least one field to update" }
);

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type AssignmentIdParamInput = z.infer<typeof assignmentIdParam>;
export type ClassIdParamInput = z.infer<typeof classIdParam>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;


