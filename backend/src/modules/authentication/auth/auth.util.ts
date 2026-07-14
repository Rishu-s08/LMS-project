
import jwt from "jsonwebtoken";
import { env } from "../../../config/config.js";

function generateAccessToken(userId: string, email: string, role: string) : string{
            const accessToken = jwt.sign(
            {
                sub: userId,
                email: email,
                role : role
            }, 
            env.ACCESS_TOKEN_SECRET || '',
            {
                expiresIn: (env.ACCESS_TOKEN_EXPIRY || '15m') as string
            } as jwt.SignOptions
        )
            return accessToken;
}

function generateRefreshToken(userId: string, jti: string) : string {
    const refreshToken = jwt.sign(
            {
                sub: userId,
                jti: jti,
            }, 
            env.REFRESH_TOKEN_SECRET || '',
            {
                expiresIn: (env.REFRESH_TOKEN_EXPIRY || '30d') as string
            } as jwt.SignOptions
        )
        return refreshToken;
}

export { generateAccessToken, generateRefreshToken };