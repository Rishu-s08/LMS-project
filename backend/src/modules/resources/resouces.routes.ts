
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

// get all resources do we need it? it will have all resources of all classes
router.get("/", authMiddleware, authorizeRoles(roles.ADMIN), resourcesController.getAllResources)


// get resource by id
router.get("/:resourceId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateParams(resourceIdParam), resourcesController.getResourceById)


// get resource by class
router.get("/classes/:classId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY, roles.STUDENT), validateParams(classIdParam), resourcesController.getResourcesByClassId)


// create resource
router.post("/", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), upload.single("attachment"), validateRequest(createResourceSchema), resourcesController.createResource)


//update resource
router.patch("/:resourceId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), upload.single("attachment"), validateParams(resourceIdParam), validateRequest(updateResourceSchema), resourcesController.updateResource)


//delete resource
router.delete("/:resourceId", authMiddleware, authorizeRoles(roles.ADMIN, roles.FACULTY), validateParams(resourceIdParam), resourcesController.deleteResource)



export default router;
