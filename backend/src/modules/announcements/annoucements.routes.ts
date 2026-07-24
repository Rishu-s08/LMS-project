import { Router } from "express";
import { AnnouncementsController } from "./annoucements.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { roles } from "../../shared/constants/enums.js";
import { validateParams, validateRequest } from "../../middlewares/validation.middleware.js";
import { announcementIdParam, classIdParam, createAnnouncementSchema, updateAnnouncementSchema } from "./annoucements.validation.js";



const router = Router();

const announcementsController = new AnnouncementsController();

/**
 * @openapi
 * /announcements/class/{classId}:
 *   get:
 *     tags: [Announcements]
 *     summary: Get all announcements for a class
 *     description: |
 *       Returns announcements ordered by newest first.
 *       Students must be enrolled in the class to view announcements (enrollment check).
 *       Faculty/admin have direct access.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of announcements
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Announcement'
 *       403:
 *         description: Student is not enrolled in this class
 *       404:
 *         description: Class not found
 */
router.get("/class/:classId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY, roles.STUDENT), validateParams(classIdParam), announcementsController.getAllAnnouncementsForClass);

/**
 * @openapi
 * /announcements/{announcementId}:
 *   get:
 *     tags: [Announcements]
 *     summary: Get announcement by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: announcementId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Announcement found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Announcement'
 *       404:
 *         description: Announcement not found
 */
router.get("/:announcementId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY, roles.STUDENT), validateParams(announcementIdParam), announcementsController.getAnnouncementById);

/**
 * @openapi
 * /announcements:
 *   post:
 *     tags: [Announcements]
 *     summary: Create an announcement for a class
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content, classId]
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *               classId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Announcement created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Announcement'
 *       404:
 *         description: Class not found
 */
router.post("/", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateRequest(createAnnouncementSchema), announcementsController.createAnnouncement);

/**
 * @openapi
 * /announcements/{announcementId}:
 *   patch:
 *     tags: [Announcements]
 *     summary: Update an announcement (partial)
 *     description: Cannot change the class an announcement belongs to
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: announcementId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *               content:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Announcement updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Announcement'
 *       400:
 *         description: Cannot change classId
 *       404:
 *         description: Announcement not found
 */
router.patch("/:announcementId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateParams(announcementIdParam), validateRequest(updateAnnouncementSchema), announcementsController.updateAnnouncement);

/**
 * @openapi
 * /announcements/{announcementId}:
 *   delete:
 *     tags: [Announcements]
 *     summary: Delete an announcement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: announcementId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Announcement deleted
 *       404:
 *         description: Announcement not found
 */
router.delete("/:announcementId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateParams(announcementIdParam), announcementsController.deleteAnnouncement);


export default router;
