import { Router } from "express";
import { UserController } from "./users.controller.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import { ChangePasswordSchema, RegisterUserSchema, updateRoleSchema } from "./user.validation.js";
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
router.patch("/update-role/:userId", authMiddleware, authorizeRoles(roles.ADMIN, roles.STUDENT), validateRequest(updateRoleSchema), userController.updateUserRole);
//TODO remove the student role from the above route, only admin should be able to update roles of other users
export default router;