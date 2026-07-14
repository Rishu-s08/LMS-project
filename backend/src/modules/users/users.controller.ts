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
}
