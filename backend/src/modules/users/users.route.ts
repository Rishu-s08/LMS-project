import { Router } from "express";
import { UserController } from "./users.controller.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import { ChangePasswordSchema, RegisterUserSchema } from "./user.validation.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { roles } from "../../shared/constants/enums.js";



const router = Router();
const userController = new UserController();



router.post("/create", validateRequest(RegisterUserSchema) ,userController.registerUser);
router.get("/me",authMiddleware, authorizeRoles(roles.STUDENT, roles.FACULTY, roles.ADMIN), userController.getCurrentUser);
router.get("/id/:userId", authMiddleware, authorizeRoles(roles.FACULTY, roles.ADMIN), userController.getUserById);
router.get("/email/:email", authMiddleware, authorizeRoles(roles.FACULTY, roles.ADMIN), userController.getUserByEmail);
router.post("/change-password", authMiddleware, authorizeRoles(roles.STUDENT, roles.FACULTY, roles.ADMIN),validateRequest(ChangePasswordSchema), userController.changePassword);

export default router;