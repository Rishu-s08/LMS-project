import { prisma } from "../../db/prisma.js";
import type { Prisma } from "../../generated/prisma/browser.js";
import { roles } from "../../shared/constants/enums.js";
import type { RegisterUserInput } from "./user.validation.js";

class UserRepository {

    async findAll(){
        return await prisma.user.findMany({
            select: {
                userId: true,
                email: true,
                name: true,
                role: true,
                branch: true,
                batch: true,
                sem: true,
                avatarUrl: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: "desc" }
        })
    }

    async findAllStudentsWithBranchAndSem(branch: string, sem: number){
        return await prisma.user.findMany({
            where: {
                role: roles.STUDENT,
                branch: branch,
                sem: sem
            }
        })
    }

    async findByUserId(userId : string){
        return await prisma.user.findUnique({
            where : {
                userId : userId
            }
        })
    }

    async findByEmail(email : string){
        return await prisma.user.findUnique({
            where : {
                email : email
            }
        })
    }

    async createUser(data : RegisterUserInput){
        return prisma.user.create({ data });
    }

    async updatePassword(userId: string, hashedPassword: string, tx? : Prisma.TransactionClient){
        const client = tx || prisma;
        return await client.user.update({
            where : {
                userId : userId
            }, data : {
                password : hashedPassword
            }
        })
    }

    async updateUserRole(userId: string, role: roles, tx? : Prisma.TransactionClient){
        const client = tx || prisma;
        return await client.user.update({
            where : {
                userId : userId
            }, data : {
                role : role
            }
        })
    }

    async updateAvatar(userId: string, avatarUrl: string){
        return await prisma.user.update({
            where : { userId },
            data : { avatarUrl }
        })
    }

    async deactivateUser(userId: string){
        return await prisma.user.update({
            where : { userId },
            data : { isActive: false }
        })
    }

    async activateUser(userId: string){
        return await prisma.user.update({
            where : { userId },
            data : { isActive: true }
        })
    }

    async deleteUser(userId: string){
        return await prisma.user.delete({
            where : { userId }
        })
    }

}

export default UserRepository;
