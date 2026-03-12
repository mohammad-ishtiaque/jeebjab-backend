import ChatService from "./chat.service.js";
import sendResponse from "../../../util/sendResponse.js";
import catchAsync from "../../../util/catchAsync.js";
import httpStatus from "http-status";

const postChat = catchAsync(async (req, res) => {
  const result = await ChatService.postChat(req.user, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Chat initiated successfully",
    data: result,
  });
});

const getChatMessages = catchAsync(async (req, res) => {
  const result = await ChatService.getChatMessages(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Messages retrieved successfully",
    data: result,
  });
});

const getAllChats = catchAsync(async (req, res) => {
  const result = await ChatService.getAllChats(req.user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All chats retrieved",
    data: result,
  });
});

const updateMessageAsSeen = catchAsync(async (req, res) => {
  // req.user থেকে userId এবং req.body থেকে chatId যাবে
  const result = await ChatService.updateMessageAsSeen(req.user, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Messages marked as seen",
    data: result,
  });
});


const uploadChatMedia = catchAsync(async (req, res) => {
  const result = await ChatService.uploadChatMedia(req);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Media uploaded successfully. Now send this URL via Socket.",
    data: result,
  });
});


export default { postChat, getChatMessages, getAllChats, updateMessageAsSeen, uploadChatMedia };