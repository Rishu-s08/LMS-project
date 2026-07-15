import { prisma } from "../../db/prisma.js";
import type { Prisma } from "../../generated/prisma/browser.js";
import type { roles } from "../../shared/constants/enums.js";
import { ApiError } from "../../shared/errors/api_error.js";
import { refreshTokenService } from "../authentication/refreshToken/refreshToken.service.js";
import type { RegisterUserInput } from "./user.validation.js";
import UserRepository from "./users.repository.js";
import bcrypt from "bcrypt";

export class UserService {
    private userRepository: UserRepository;
    private refreshTokenService: refreshTokenService;
    constructor() {
        this.userRepository = new UserRepository();
        this.refreshTokenService = new refreshTokenService();
    }

    async register(input: RegisterUserInput){
        const existingUser = await this.userRepository.findByEmail(input.email);
        if(existingUser){
            throw new ApiError(409, "User with this email already exists");
        }

        const hashedPassword = await bcrypt.hash(input.password, 10);
        const user = await this.userRepository.createUser({
            ...input,
            password: hashedPassword
        })

        //strip password before returning user object
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async getUserById(userId: string){
        const user = await this.userRepository.findByUserId(userId);
        if(!user){
            throw new ApiError(404, "User not found");
        }
        //strip password before returning user object
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async getUserByIdWithPass(userId: string, tx?: Prisma.TransactionClient){
        const client = tx || prisma;
        const user = await client.user.findUnique({
            where: {
                userId: userId
            }
        });
        if(!user){
            throw new ApiError(404, "User not found");
        }
        //strip password before returning user object
        return user;
    }

    async getUserByEmail(email: string){
        const user = await this.userRepository.findByEmail(email);
        if(!user){
            throw new ApiError(404, "User not found");
        }
        //strip password before returning user object
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async getProfile(userId: string){
        const user = await this.userRepository.findByUserId(userId);
        if(!user){
            throw new ApiError(404, "User not found");
        }
        //strip password before returning user object
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async changePassword(userId: string, oldPassword: string, newPassword: string){
        // check if user exists in const 
        const user = await this.getUserByIdWithPass(userId);
        if(!user){
            throw new ApiError(404, "User not found");
        }

        // check if old password matches
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

        if(!isPasswordValid){
            throw new ApiError(401, "Old password is incorrect");
        }

        // hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);


        // 5. Execute password update and clear ALL global active refresh tokens in a safe transaction ⚡
        await prisma.$transaction(async (tx) => {
            await this.userRepository.updatePassword(userId, hashedNewPassword, tx);
            await this.refreshTokenService.revokeAllRefreshTokenByUserId(userId, tx);
        });

        // login user again and return new access and refresh tokens
        return {
            message: "Password changed successfully. Please login again."
        }

    }

    async resetPassword(userId: string, newPassword: string, tx? : Prisma.TransactionClient){

        const client = tx || prisma;

        // check if user exists in const 
        const user = await this.getUserByIdWithPass(userId, client);
        if(!user){
            throw new ApiError(404, "User not found");
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await this.userRepository.updatePassword(userId, hashedNewPassword, client);
        await this.refreshTokenService.revokeAllRefreshTokenByUserId(userId, client);

    }


    async updateUserRole(userId: string, role: roles){
        const user = await this.getUserById(userId);
        if(!user){
            throw new ApiError(404, "User not found");
        }
        const data =  await this.userRepository.updateUserRole(userId, role);

        const { password, ...userWithoutPassword } = data;
        return userWithoutPassword;
    }
}
