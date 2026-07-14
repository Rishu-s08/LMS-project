import type { Prisma } from "@prisma/client/extension";
import { prisma } from "../../../db/prisma.js";




export class RefreshTokenRepository {


    async createRefreshToken(userId: string, jti: string, expiresAt: Date, tx? : Prisma.TransactionClient): Promise<void> {
        const client = tx || prisma;
        await client.refreshToken.create({
            data: {
                tokenId: jti,
                expiresAt: expiresAt,
                userId: userId
            }
        })
    }

    async findRefreshTokenByJti(jti: string) {
        const refreshToken = await prisma.refreshToken.findUnique({
            where: {
                tokenId: jti
            },
            include: {
                user: true
            }
        })
        return refreshToken;
    }

    async revokeRefreshToken(jti: string, tx? : Prisma.TransactionClient): Promise<void> {
        const client = tx || prisma;
        await client.refreshToken.update({
            where: {
                tokenId: jti
            },
            data: {
                revokedAt : new Date()
            }
        })
    }

    async revokeAllRefreshTokensByUserId(userId: string, tx? : Prisma.TransactionClient): Promise<void> {
        const client = tx || prisma;
        await client.refreshToken.updateMany({
            where: {
                userId: userId,
                revokedAt: null
            },
            data: {
                revokedAt: new Date()
            }
        });
    }
}

