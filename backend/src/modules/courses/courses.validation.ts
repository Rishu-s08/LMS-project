import { z } from "zod";


export const createCourseSchema = z.object({
    name: z.string().trim().min(3, "Course name must be at least 3 characters long"),
    code: z.string().trim().min(2, "Course code must be at least 2 characters long"),
    description: z.string().nullable().default(null),
    credits : z.number().int().positive().min(1, "Credits must be at least 1").max(10, "Credits cannot be more than 10"),
})

// The requirements for UPDATING a post (All fields become optional automatically!)
export const updateCourseSchema = createCourseSchema.partial().refine(
  (data) => Object.keys(data).length > 0, 
  { message: "You must provide at least one field to update" }
);

export const courseIdParamSchema = z.object({
    courseId: z.uuid("Invalid course ID format"),
});

export const courseCodeParamSchema = z.object({
    courseCode: z.string().trim().min(2, "Course code must be at least 2 characters long"),
});


export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CourseIdParamInput = z.infer<typeof courseIdParamSchema>;
export type CourseCodeParamInput = z.infer<typeof courseCodeParamSchema>;
