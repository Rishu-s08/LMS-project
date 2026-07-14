import type { Response, Request } from "express";
import { asyncHandler } from "../../../shared/utils/asyncHandler.js";
import { AuthService } from "./auth.services.js";
import { success } from "zod";
import { refreshTokenService } from "../refreshToken/refreshToken.service.js";



export class AuthController{
    private authService : AuthService;
    private refreshTokenService : refreshTokenService;
    constructor() {
        this.authService = new AuthService();
        this.refreshTokenService = new refreshTokenService();
    }

    loginUser = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;
        const { accessToken, refreshToken, user } = await this.authService.loginUser(email, password);
        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            accessToken,
            refreshToken,
            user: user
        })
    })

    refreshToken = asyncHandler(async (req: Request, res: Response) => {
        const {refreshToken} = req.body;

        const {accessToken, newRefreshToken} = await this.refreshTokenService.refreshAccessToken(refreshToken);

        res.status(200).json({
            success: true,
            message: "Access token refreshed successfully",
            accessToken,
            refreshToken: newRefreshToken
        })
    })

    logoutUser = asyncHandler(async (req: Request, res: Response) => {
        const {refreshToken} = req.body;
        await this.authService.logoutUser(refreshToken);
        res.status(200).json({
            success: true,
            message: "User logged out successfully"
        })
    })

    forgotPassword = asyncHandler(async (req: Request, res: Response) => {
        const {email} = req.body;
        // dev purpose, we will return the reset link in the response. In production, we would send this link to the user's email address.
        const result = await this.authService.forgotPassword(email);
        res.status(200).json({
            success: true,
            resetLink: result.resetLink,
            token: result.token,
            message: "Password reset link sent to email"
        })
    })

    resetPassword = asyncHandler(async (req: Request, res: Response) => {
        const {token, password} = req.body;
        await this.authService.resetPassword(token, password);
        res.status(200).json({
            success: true,
            message: "Password reset successfully"
        })
    })
}
