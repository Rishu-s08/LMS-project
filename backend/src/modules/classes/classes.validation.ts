import { z } from "zod";


//TODO : what if sem is 3 but year 1
export const CreateClassSchema = z.object({
    facultyId: z.uuid().describe("Id of the faculty member creating the class"),
    semester: z.number().int().min(1).max(8).describe("Semester of the class that been getting created"),
    year: z.number().int().min(1).max(4).describe("Year of the Class that been getting created"),
    branch: z.string().describe("Branch of the class that been getting created"),
    academicYear: z.string().regex(/^\d{4}-\d{4}$/, "Academic year must be in the format YYYY-YYYY").describe("Academic year of the class in YYYY-YYYY"),
    courseId: z.uuid().describe("ID of the course to which the class belongs"),
})

export const UpdateClassSchema = CreateClassSchema.partial().refine(
    (data) => Object.keys(data).length > 0, 
    { message: "You must provide at least one field to update" }
);

export const classIdParamSchema = z.object({
    classId: z.uuid("Invalid class ID format"),
});

export const userIdParamSchema = z.object({
    userId: z.uuid("Invalid user ID format"),
});

export type CreateClassInput = z.infer<typeof CreateClassSchema>;
export type ClassIdParamInput = z.infer<typeof classIdParamSchema>;
export type UserIdParamInput = z.infer<typeof userIdParamSchema>;
export type UpdateClassInput = z.infer<typeof UpdateClassSchema>;
