import { Router } from "express";
import { AnnouncementsController } from "./annoucements.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { roles } from "../../shared/constants/enums.js";
import { validateParams, validateRequest } from "../../middlewares/validation.middleware.js";
import { announcementIdParam, classIdParam, createAnnouncementSchema, updateAnnouncementSchema } from "./annoucements.validation.js";
import { de } from "zod/locales";



const router = Router();

const announcementsController = new AnnouncementsController();

router.get("/class/:classId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY, roles.STUDENT), validateParams(classIdParam), announcementsController.getAllAnnouncementsForClass);
router.get("/:announcementId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY, roles.STUDENT), validateParams(announcementIdParam), announcementsController.getAnnouncementById);
router.post("/", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateRequest(createAnnouncementSchema), announcementsController.createAnnouncement);
router.patch("/:announcementId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateParams(announcementIdParam), validateRequest(updateAnnouncementSchema), announcementsController.updateAnnouncement);
router.delete("/:announcementId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateParams(announcementIdParam), announcementsController.deleteAnnouncement);


export default router;