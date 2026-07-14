
import { Router } from 'express';
import { validateRequest } from '../../../middlewares/validation.middleware.js';
import { forgotPasswordSchema, loginUserSchema, refreshTokenSchema, resetPasswordSchema } from './auth.validation.js';
import { AuthController } from './auth.controller.js';
import { authMiddleware } from '../../../middlewares/auth.middleware.js';

const router = Router();

const authController = new AuthController();

router.post('/login', 
    validateRequest(loginUserSchema),
    authController.loginUser
);

router.post('/refresh', validateRequest(refreshTokenSchema), authController.refreshToken);

router.post('/logout',validateRequest(refreshTokenSchema), authMiddleware, authController.logoutUser);

router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);

router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);

export default router;
