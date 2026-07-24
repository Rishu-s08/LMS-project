import { Router } from "express";
import { UserController } from "./users.controller.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import { ChangePasswordSchema, RegisterUserSchema, updateRoleSchema } from "./user.validation.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { roles } from "../../shared/constants/enums.js";



const router = Router();
const userController = new UserController();

/**
 * @openapi
 * /users/create:
 *   post:
 *     tags: [Users]
 *     summary: Register a new user
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *                 minLength: 3
 *               role:
 *                 type: string
 *                 enum: [STUDENT, FACULTY, ADMIN]
 *                 default: STUDENT
 *               branch:
 *                 type: string
 *                 nullable: true
 *               batch:
 *                 type: string
 *                 nullable: true
 *               sem:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 8
 *                 nullable: true
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       409:
 *         description: User with this email already exists
 *       401:
 *         description: Unauthorized
 */
router.post("/create", authMiddleware, validateRequest(RegisterUserSchema) ,userController.registerUser);

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get("/me",authMiddleware, authorizeRoles(roles.STUDENT, roles.FACULTY, roles.ADMIN), userController.getCurrentUser);

/**
 * @openapi
 * /users/id/{userId}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       403:
 *         description: Forbidden — requires FACULTY or ADMIN role
 */
router.get("/id/:userId", authMiddleware, authorizeRoles(roles.FACULTY, roles.ADMIN), userController.getUserById);

/**
 * @openapi
 * /users/email/{email}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by email
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       403:
 *         description: Forbidden — requires FACULTY or ADMIN role
 */
router.get("/email/:email", authMiddleware, authorizeRoles(roles.FACULTY, roles.ADMIN), userController.getUserByEmail);

/**
 * @openapi
 * /users/change-password:
 *   post:
 *     tags: [Users]
 *     summary: Change current user's password
 *     description: Verifies old password, updates to new, and revokes all active sessions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 minLength: 8
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed — all sessions revoked
 *       401:
 *         description: Old password is incorrect
 */
router.post("/change-password", authMiddleware, authorizeRoles(roles.STUDENT, roles.FACULTY, roles.ADMIN),validateRequest(ChangePasswordSchema), userController.changePassword);

/**
 * @openapi
 * /users/update-role/{userId}:
 *   patch:
 *     tags: [Users]
 *     summary: Update a user's role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [STUDENT, FACULTY, ADMIN]
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       403:
 *         description: Forbidden — requires ADMIN role
 *       404:
 *         description: User not found
 */
router.patch("/update-role/:userId", authMiddleware, authorizeRoles(roles.ADMIN, roles.STUDENT), validateRequest(updateRoleSchema), userController.updateUserRole);
//TODO remove the student role from the above route, only admin should be able to update roles of other users
export default router;
