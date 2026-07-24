import type { roles } from "../../shared/constants/enums.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { AnnouncementServices } from "./annoucements.service.js";



export class AnnouncementsController {
    private readonly announcementsService: AnnouncementServices;
    constructor() {
        this.announcementsService = new AnnouncementServices();
    }

    getAllAnnouncementsForClass = asyncHandler(async (req, res) => {
        const {classId} = req.params;
        const userId = req.user?.sub as string;
        const userRole = req.user?.role as roles;
        const announcements = await this.announcementsService.getAllAnnouncementsForClass(classId as string, userId, userRole);
        res.status(200).json({
            success: true,
            message : "Announcements fetched successfully",
            data: announcements
        });
    });

    getAnnouncementById = asyncHandler(async (req, res) => {
        const {announcementId} = req.params;
        const announcement = await this.announcementsService.getAnnouncementById(announcementId as string);
        res.status(200).json({
            success: true,
            message : "Announcement fetched successfully",
            data: announcement
        });
    });

    createAnnouncement = asyncHandler(async (req, res) => {
        const announcementData = req.body;
        const newAnnouncement = await this.announcementsService.createAnnouncement(announcementData);
        res.status(201).json({
            success: true,
            message : "Announcement created successfully",
            data: newAnnouncement
        });
    }) 

    updateAnnouncement = asyncHandler(async (req, res) => {
        const {announcementId} = req.params;
        const announcementData = req.body;
        const updatedAnnouncement = await this.announcementsService.updateAnnouncement(announcementId as string, announcementData);
        res.status(200).json({
            success: true,
            message : "Announcement updated successfully",
            data: updatedAnnouncement
        });
    })

    deleteAnnouncement = asyncHandler(async (req, res) => {
        const {announcementId} = req.params;
        await this.announcementsService.deleteAnnouncement(announcementId as string);
        res.status(200).json({
            success: true,
            message : "Announcement deleted successfully"
        });
    })  

}