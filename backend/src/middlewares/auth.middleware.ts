import { env } from "../config/config.js";
import UserRepository from "../modules/users/users.repository.js";
import { ApiError } from "../shared/errors/api_error.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
import jwt from "jsonwebtoken";


const userRepository = new UserRepository();

interface AuthenticatedUser {
  sub: string;
  email: string;
  role: "STUDENT" | "FACULTY" | "ADMIN";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authMiddleware = asyncHandler(async (req, res, next) => {

    // 2. Extract Authorization Header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "Access denied. Token missing."));
    }

    // 3. Isolate the token string from "Bearer <token>"
    const token = authHeader.split(" ")[1];

    if (!token) {
      return next(new ApiError(401, "Access denied. Invalid token format."));
    }

    // 4. Mathematically verify token using Access Secret
    const decoded = jwt.verify(
      token,
      env.ACCESS_TOKEN_SECRET || ""
    ) as AuthenticatedUser;

    // console.log("🔍 DECODED TOKEN PAYLOAD:", decoded); // 👈 Add this line temporary

    const userCheck = await userRepository.findByUserId(decoded.sub);
    if (!userCheck) {
      return next(new ApiError(401, "Access denied. User not found."));
    }

    // 5. Inject payload into request context so subsequent logic can use it
    req.user = {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    // Move onto your controller
    next();

})
