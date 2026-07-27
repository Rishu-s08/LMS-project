import type { roles } from "../../shared/constants/enums.js";
import { ApiError } from "../../shared/errors/api_error.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { UserService } from "./users.services.js";



export class UserController {
    private userService: UserService;

  constructor() {  
    this.userService = new UserService(); // Inject service
  }

  registerUser = asyncHandler(async (req, res) => {
    const user = await this.userService.register(req.body);

    res.status(201).json({
        success : true,
        message : "User registered successfully",
        data : user
    })
  })

  getUserById = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const user = await this.userService.getUserById(userId as string);

    res.status(200).json({
        success : true,
        message : "User found successfully",
        data : user
    })
  })

  getUserByEmail = asyncHandler(async (req, res) => {
    const email = req.params.email;
    const user = await this.userService.getUserByEmail(email as string);

    res.status(200).json({
        success : true,
        message : "User found successfully",
        data : user
    })
  })

  getCurrentUser = asyncHandler(async (req, res) => {
    
    const userId = req.user?.sub;

    const user = await this.userService.getUserById(userId as string);

    res.status(200).json({
        success : true,
        message : "Current user profile fetched successfully",
        data : user
    })
  })

  updateUserRole = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const { role } : {role : roles} = req.body;
    const updatedUser = await this.userService.updateUserRole(userId as string, role);

    res.status(200).json({
        success : true,
        message : "User role updated successfully",
        data : updatedUser
    })
  })

  changePassword = asyncHandler(async (req, res ) => {
    const userId = req.user?.sub;
    const {oldPassword, newPassword} = req.body;

    if(!userId){
        throw new ApiError(401, "Unauthorized. User not found in request context.");
    }

    await this.userService.changePassword(userId, oldPassword, newPassword);

    res.status(200).json({
        success : true,
        message : "Password changed successfully",
    })
  })

  getAllUsers = asyncHandler(async (req, res) => {
    const users = await this.userService.getAllUsers();

    res.status(200).json({
        success : true,
        message : "Users fetched successfully",
        data : users
    })
  })

  updateAvatar = asyncHandler(async (req, res) => {
    const userId = req.user?.sub;

    if(!userId){
        throw new ApiError(401, "Unauthorized. User not found in request context.");
    }

    const file = req.file || null;
    const updatedUser = await this.userService.updateAvatar(userId, file);

    res.status(200).json({
        success : true,
        message : "Avatar updated successfully",
        data : updatedUser
    })
  })

  deactivateUser = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const user = await this.userService.deactivateUser(userId as string);

    res.status(200).json({
        success : true,
        message : "User deactivated successfully",
        data : user
    })
  })

  activateUser = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const user = await this.userService.activateUser(userId as string);

    res.status(200).json({
        success : true,
        message : "User activated successfully",
        data : user
    })
  })

  deleteUser = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    await this.userService.deleteUser(userId as string);

    res.status(200).json({
        success : true,
        message : "User deleted successfully",
    })
  })
}
