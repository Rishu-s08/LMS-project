import { prisma } from "../../db/prisma.js";
import type { Prisma } from "../../generated/prisma/browser.js";
import type { roles } from "../../shared/constants/enums.js";
import type { RegisterUserInput } from "./user.validation.js";

class UserRepository {

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

}

export default UserRepository;
