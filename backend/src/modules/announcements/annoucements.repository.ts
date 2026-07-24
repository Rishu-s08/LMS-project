import { prisma } from "../../db/prisma.js";
import type { CreateAnnouncementInput } from "./annoucements.validation.js";



export class AnnouncementsRepository {

    async getAllAnnouncementsForClass(classId: string) {
        return await prisma.announcement.findMany({
            where: { classId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getAnnouncementById(announcementId: string) {
        return await prisma.announcement.findUnique({
            where: { announcementId }
        });
    }

    async createAnnouncement(data: CreateAnnouncementInput) {
        return await prisma.announcement.create({
            data
        });
    }

    async updateAnnouncement(announcementId: string, data: Partial<CreateAnnouncementInput>) {
        return await prisma.announcement.update({
            where: { announcementId },
            data
        });
    }

    async deleteAnnouncement(announcementId: string) {
        return await prisma.announcement.delete({
            where: { announcementId }
        });
    }

}