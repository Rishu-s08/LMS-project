import {env} from "../../../config/config.js";
import { ApiError } from "../../../shared/errors/api_error.js";
import { logger } from "../../../shared/utils/logger.util.js";
import UserRepository from "../../users/users.repository.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PassTokenRepository } from "../passwordToken/passToken.repository.js";
import { RefreshTokenRepository } from "../refreshToken/refreshToken.repository.js";
import { generateAccessToken, generateRefreshToken } from "./auth.util.js";
import { UserService } from "../../users/users.services.js";
import { prisma } from "../../../db/prisma.js";
import crypto from "node:crypto";


export class AuthService {
    private userRepository: UserRepository;
    private refreshTokenRepository: RefreshTokenRepository;
    private passTokenRepository: PassTokenRepository;
    private userService: UserService;
    constructor() {
        this.userRepository = new UserRepository();
        this.refreshTokenRepository = new RefreshTokenRepository();
        this.passTokenRepository = new PassTokenRepository();
        this.userService = new UserService();
    }

    async loginUser(email: string, passwordInput: string){
        const user = await this.userRepository.findByEmail(email);
        if(!user){
            throw new ApiError(401, "Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(passwordInput, user.password);
        if(!isPasswordValid){
            throw new ApiError(401, "Invalid email or password");
        }

        // const accessJti = crypto.randomUUID(); // this is needed as though we are not storing in the db, when we need to instant block user we can store this into redis in blocked with TTL as 15 min so whenever the middleware checks the access token, it can check if the jti is in the blocked list or not. If it is in the blocked list, then it will throw an error and user will be logged out.
        const refreshJti = crypto.randomUUID(); 

        const accessToken = generateAccessToken(user.userId, user.email, user.role);

        const refreshToken = generateRefreshToken(user.userId, refreshJti);

        const DAYS_TO_EXPIRY = 30;
        const expiresAtDate = new Date(Date.now() + DAYS_TO_EXPIRY * 24 * 60 * 60 * 1000);

        await this.refreshTokenRepository.createRefreshToken(user.userId, refreshJti, expiresAtDate);

        logger.info({ userId: user.userId, email: user.email }, "User logged in");

        const { password, ...userWithoutPassword } = user;

        return {
            accessToken,
            refreshToken,
            user: userWithoutPassword   
        }

    }


    async logoutUser(refreshToken: string){
        let payload : { jti: string, sub: string};
        try {
            payload = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as { jti: string, sub: string};
        } catch (error : any) {
            if(error.name === "TokenExpiredError") {
                return; // if the refresh token is expired, we don't need to do anything as it is already invalidated
            }
            if(error.name === "JsonWebTokenError") {
                throw new ApiError(401, "Refresh token is invalid or has already been revoked");
            }

            throw new ApiError(401, "Refresh token is invalid or has already been revoked", [error]);
        }
            const token = await this.refreshTokenRepository.findRefreshTokenByJti(payload.jti);

            if(!token || token.revokedAt) {
                return; // if the token is not found or already revoked, we don't need to do anything as it is already invalidated
            }

            await this.refreshTokenRepository.revokeRefreshToken(payload.jti);
            logger.info({ userId: payload.sub }, "User logged out");
    }


    async forgotPassword(email: string){
        const user = await this.userRepository.findByEmail(email);
        if(!user){
            return {
                resetLink: null,
                token: null
            }
        }

        // 2. GENERATE THE RAW TOKEN: Create a 32-byte completely random string (64 characters long)
        const rawResetToken = crypto.randomBytes(32).toString("hex");

        // 3. GENERATE THE HASH: Create a deterministic SHA-256 hash string for the database 🔒
        const encryptedTokenHash = crypto
            .createHash("sha256")
            .update(rawResetToken)
            .digest("hex");

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // token expires in 15 minutes

        const resetLink = "http://localhost:3000/reset-password?token=" + rawResetToken + "&email=" + email; // send the token and email as query params

        // store the hashed token and expiry in the database
        await this.passTokenRepository.createPasswordToken(user.userId, encryptedTokenHash, expiresAt);

        logger.info({ userId: user.userId }, "Password reset token generated");


        // For dev purposes, we will return the reset link in the response. In production, we would send this link to the user's email address.

        return {
            resetLink: resetLink,
            token: rawResetToken
        }
    }

    async resetPassword(token: string, newPassword: string){
        const incomingTokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const isTokenValid = await this.passTokenRepository.findPasswordTokenByHash(incomingTokenHash);

        if(!isTokenValid || isTokenValid.expiresAt < new Date() || isTokenValid.usedAt){
            throw new ApiError(400, "Invalid or expired password reset token");
        }

        const userId = isTokenValid.userId;
        
        if(!userId){
            throw new ApiError(404, "User not found");
        }

        await prisma.$transaction(async (tx) => {

            await this.userService.resetPassword(userId, newPassword, tx);

            await this.passTokenRepository.markTokenAsUsed(incomingTokenHash, tx);

        });
    }

}


