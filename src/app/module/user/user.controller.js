import UserService from "./user.service.js";
import sendResponse from "../../../util/sendResponse.js";
import catchAsync from "../../../util/catchAsync.js";

const postUser = catchAsync(async (req, res) => {
  const result = await UserService.postUser(req.user, req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User created successfully",
    data: result,
  });
});

const getUser = catchAsync(async (req, res) => {
  const result = await UserService.getUser(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req, res) => {
  const result = await UserService.getAllUsers(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users retrieved successfully",
    data: result,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const result = await UserService.updateUser(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const result = await UserService.deleteUser(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

const UserController = {
  postUser,
  getUser,
  getAllUsers,
  updateUser,
  deleteUser,
};

export default UserController;