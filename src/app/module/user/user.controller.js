import UserService from "./user.service.js";
import sendResponse from "../../../util/sendResponse.js";
import catchAsync from "../../../util/catchAsync.js";

const becomeDriver = catchAsync(async (req, res) => {
  const result = await UserService.becomeDriver(req.user, req.body, req.files);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Driver created successfully",
    data: result,
  });
});

const getUserProfile = catchAsync(async (req, res) => {
  const result = await UserService.getUserProfile(req.user);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User profile fetched successfully",
    data: result,
  });
});

const UserController = {
  becomeDriver,
  getUserProfile
};

export default UserController;