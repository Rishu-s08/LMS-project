import {z} from "zod";

export const RoleEnum = z.enum(["ADMIN", "STUDENT", "FACULTY"]);

export const RegisterUserSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    role: RoleEnum.default(RoleEnum.enum.STUDENT),
    branch: z.string().nullable().default(null),
    batch: z.string().nullable().default(null), // 2024
    sem: z.number().int().min(1).max(8).nullable().default(null),
    name: z.string().min(3, "Name must be at least 3 characters long"),
    avatarUrl : z.url("Invalid URL").nullable().default(null),
})

export const ChangePasswordSchema = z.object({
    oldPassword: z.string().min(8, "Old password must be at least 8 characters long"),
    newPassword: z.string().min(8, "New password must be at least 8 characters long"),
})

export const updateRoleSchema = z.object({
    role : z.enum(RoleEnum.options, "Invalid role. Must be one of ADMIN, STUDENT, or FACULTY")
})

export const userIdParamSchema = z.object({
    userId: z.uuid("Invalid user ID format"),
});


export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>; 
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UserIdParamInput = z.infer<typeof userIdParamSchema>;