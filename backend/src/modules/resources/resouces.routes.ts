import { Router } from "express";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { roles } from "../../shared/constants/enums.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import upload from "../../config/multer.config.js";
import { validateParams, validateRequest } from "../../middlewares/validation.middleware.js";
import { ResourcesController } from "./resources.controller.js";
import { classIdParam, createResourceSchema, resourceIdParam, updateResourceSchema } from "./resources.validation.js";

const router = Router();
const resourcesController = new ResourcesController();

/**
 * @openapi
 * /resources:
 *   get:
 *     tags: [Resources]
 *     summary: Get all resources (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all resources
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
 *                     $ref: '#/components/schemas/Resource'
 */
router.get("/", authMiddleware, authorizeRoles(roles.ADMIN), resourcesController.getAllResources)

/**
 * @openapi
 * /resources/{resourceId}:
 *   get:
 *     tags: [Resources]
 *     summary: Get resource by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Resource found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *       404:
 *         description: Resource not found
 */
router.get("/:resourceId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateParams(resourceIdParam), resourcesController.getResourceById)

/**
 * @openapi
 * /resources/classes/{classId}:
 *   get:
 *     tags: [Resources]
 *     summary: Get all resources for a class
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
 *         description: List of resources for the class
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
 *                     $ref: '#/components/schemas/Resource'
 *       404:
 *         description: Class not found
 */
router.get("/classes/:classId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY, roles.STUDENT), validateParams(classIdParam), resourcesController.getResourcesByClassId)

/**
 * @openapi
 * /resources:
 *   post:
 *     tags: [Resources]
 *     summary: Create a new resource
 *     description: Upload course materials (PDF, images) for a class via multipart/form-data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, classId]
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 nullable: true
 *               classId:
 *                 type: string
 *                 format: uuid
 *               attachment:
 *                 type: string
 *                 format: binary
 *                 description: "PDF, JPEG, or PNG (max 10MB)"
 *     responses:
 *       201:
 *         description: Resource created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *       404:
 *         description: Class not found
 */
router.post("/", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), upload.single("attachment"), validateRequest(createResourceSchema), resourcesController.createResource)

/**
 * @openapi
 * /resources/{resourceId}:
 *   patch:
 *     tags: [Resources]
 *     summary: Update a resource (partial)
 *     description: If a new file is uploaded, the old one is deleted from cloud storage
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               classId:
 *                 type: string
 *                 format: uuid
 *               attachment:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Resource updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *       404:
 *         description: Resource not found
 */
router.patch("/:resourceId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), upload.single("attachment"), validateParams(resourceIdParam), validateRequest(updateResourceSchema), resourcesController.updateResource)

/**
 * @openapi
 * /resources/{resourceId}:
 *   delete:
 *     tags: [Resources]
 *     summary: Delete a resource
 *     description: Deletes the record and removes the attachment from cloud storage
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Resource deleted
 *       404:
 *         description: Resource not found
 */
router.delete("/:resourceId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateParams(resourceIdParam), resourcesController.deleteResource)



export default router;
