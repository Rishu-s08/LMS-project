
import { RefreshTokenRepository } from "./refreshToken.repository.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { ApiError } from "../../../shared/errors/api_error.js";
import { env } from "../../../config/config.js";
import { prisma } from "../../../db/prisma.js";
import { generateAccessToken, generateRefreshToken } from "../auth/auth.util.js";
import type { Prisma } from "../../../generated/prisma/browser.js";


export class refreshTokenService {
    private refreshTokenRepository: RefreshTokenRepository;

    constructor() {
        this.refreshTokenRepository = new RefreshTokenRepository();
    }

    async refreshAccessToken(refreshToken: string){
        //1. Verify the refresh token
        // 2. if valid, extract the userId and jti from the refresh token
        // 3. check if the jti exists in the database for that userId
        // 4. check the expiry date of the refresh token in the database and is not revoked or  expired (.verify do it itself)
        // 5. if all checks pass, generate a new access token and a new refresh token
        // 6. revoke the old refresh token
        // 7. store the new refresh token in the database and 
        // 8. return the new access token and new refresh token to the user

        try {
            // 1, 2 verify the refresh token
            const { sub, jti } = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as { sub: string; jti: string };
            
            // 3. check if the jti exists in the database for that userId
            const storedRefreshToken = await this.refreshTokenRepository.findRefreshTokenByJti(jti);
            if(!storedRefreshToken || storedRefreshToken.userId !== sub){
                throw new ApiError(401, "Invalid refresh token");
            }
            if(!storedRefreshToken.user || !storedRefreshToken.user.isActive){
                throw new ApiError(401, "User associated with this refresh token not found or is inactive");
            }
            if(storedRefreshToken.revokedAt){
                throw new ApiError(401, "Refresh token has been revoked");
            }

            // 4. revoke the old refresh token
            // 5. generate a new access token and a new refresh token
            const DAYS_TO_EXPIRY = 30;
            const expiresAtDate = new Date(Date.now() + DAYS_TO_EXPIRY * 24 * 60 * 60 * 1000);
            
            const refreshJti = crypto.randomUUID();

            await prisma.$transaction(async (tx) => {
                await this.refreshTokenRepository.revokeRefreshToken(jti, tx);
                await this.refreshTokenRepository.createRefreshToken(sub, refreshJti, expiresAtDate, tx);
            })
            const newAccessToken = generateAccessToken(storedRefreshToken.userId, storedRefreshToken.user.email, storedRefreshToken.user.role);

            const newRefreshToken = generateRefreshToken(storedRefreshToken.userId, refreshJti);

            return {accessToken: newAccessToken, newRefreshToken};

        }catch (error) {

        throw new ApiError(401, "Invalid or expired refresh token signature");

        }

    }

    async revokeAllRefreshTokenByUserId(userId : string, tx?: Prisma.TransactionClient){
        await this.refreshTokenRepository.revokeAllRefreshTokensByUserId(userId, tx);
    }
}