import {email, z} from "zod";

export const loginUserSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
})

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
})

export const forgotPasswordSchema = z.object({
    email: z.email("Invalid email address"),
})

export const resetPasswordSchema = z.object({
    token: z.string("Invalid token"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
})

export type loginUserInput = z.infer<typeof loginUserSchema>;
export type refreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type forgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type resetPasswordInput = z.infer<typeof resetPasswordSchema>;