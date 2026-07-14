import type { Prisma } from "@prisma/client/extension";
import { prisma } from "../../../db/prisma.js";



export class PassTokenRepository {

    async createPasswordToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
        await prisma.passwordResetToken.create({
            data: {
                userId: userId,
                token : tokenHash,
                expiresAt: expiresAt
            }
        })
    }

    async findPasswordTokenByHash(tokenHash: string) {
        const passwordToken = await prisma.passwordResetToken.findUnique({
            where: {
                token: tokenHash
            },
            include: {
                user: true
            }
        })
        return passwordToken;
    }

    async markTokenAsUsed(tokenHash: string, tx? : Prisma.TransactionClient): Promise<void> {
        const client = tx || prisma;
        await client.passwordResetToken.update({
            where: {
                token: tokenHash
            },
            data: {
                usedAt : new Date()
            }
        })
    }

}
