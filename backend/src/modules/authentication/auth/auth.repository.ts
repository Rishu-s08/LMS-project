import { prisma } from "../../../db/prisma.js";



class AuthRepository {

    async findUserByEmail(email: string) {
        return await prisma.user.findUnique({
            where: {
                email: email
            }
        });
    }


}
