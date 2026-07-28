import { roles } from "../../shared/constants/enums.js";
import { ApiError } from "../../shared/errors/api_error.js";
import { logger } from "../../shared/utils/logger.util.js";
import { publishEvent } from "../../config/rabbitmq.js";
import { routingKeys } from "../../shared/constants/constants.js";
import { ClassesService } from "../classes/classes.service.js";
import { EnrollmentsService } from "../enrollments/enrollments.service.js";
import { UserService } from "../users/users.services.js";
import { AnnouncementsRepository } from "./annoucements.repository.js";
import type { CreateAnnouncementInput } from "./annoucements.validation.js";




export class AnnouncementServices {
    private readonly announcementsRepository: AnnouncementsRepository;
    private readonly classesService: ClassesService;
    private readonly enrollmentsService: EnrollmentsService;
    private readonly usersService: UserService;
    constructor() {
        this.announcementsRepository = new AnnouncementsRepository();
        this.classesService = new ClassesService();
        this.enrollmentsService = new EnrollmentsService();
        this.usersService = new UserService();
    }


    async getAllAnnouncementsForClass(classId: string, userId: string, userRole: roles) {
        const classData = await this.classesService.getClassById(classId);
        if (!classData) {
            throw new ApiError(404, "Class not found");
        }
        if(userRole === roles.STUDENT) {
            const isEnrolled = await this.enrollmentsService.isStudentEnrolledInClass(userId, classId);
            if(!isEnrolled) {
                throw new ApiError(403, "You are not enrolled in this class");
            }
        }
        return await this.announcementsRepository.getAllAnnouncementsForClass(classId);
    }

    async getAnnouncementById(announcementId: string) {
        const announcement = await this.announcementsRepository.getAnnouncementById(announcementId);
        if (!announcement) {
            throw new ApiError(404, "Announcement not found");
        }
        return announcement;
    }

    async createAnnouncement(data: CreateAnnouncementInput) {
        const classData = await this.classesService.getClassById(data.classId);
        if (!classData) {
            throw new ApiError(404, "Class not found");
        }
        const announcement = await this.announcementsRepository.createAnnouncement(data);

        publishEvent(routingKeys.announcementCreated, {
            announcementId: announcement.announcementId,
            classId: announcement.classId,
        });

        logger.info({ announcementId: announcement.announcementId, classId: announcement.classId }, "Announcement created");
        return announcement;
    }

    async updateAnnouncement(announcementId: string, data: Partial<CreateAnnouncementInput>) {
        const announcement = await this.announcementsRepository.getAnnouncementById(announcementId);
        if (!announcement) {
            throw new ApiError(404, "Announcement not found");
        }
        if(data.classId && data.classId !== announcement.classId) {
            throw new ApiError(400, "Cannot change the class of an announcement");
        }
        return await this.announcementsRepository.updateAnnouncement(announcementId, data);

    }

    async deleteAnnouncement(announcementId: string) {
        const announcement = await this.announcementsRepository.getAnnouncementById(announcementId);
        if (!announcement) {
            throw new ApiError(404, "Announcement not found");
        }
        return await this.announcementsRepository.deleteAnnouncement(announcementId);
    }
}