import PostService from "./post.service.js";
import sendResponse from "../../../util/sendResponse.js";
import catchAsync from "../../../util/catchAsync.js";

const createPost = catchAsync(async (req, res) => {
  const result = await PostService.createPost(req.user, req.body, req.files);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Post created successfully",
    data: result,
  });
});

const getMyPosts = catchAsync(async (req, res) => {
  const result = await PostService.getMyPosts(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "My posts retrieved successfully",
    data: result,
  });
});

const getPostById = catchAsync(async (req, res) => {
  const result = await PostService.getPostById(req.user, req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Post retrieved successfully",
    data: result,
  });
});

const getAllPosts = catchAsync(async (req, res) => {
  const result = await PostService.getAllPosts(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Posts retrieved successfully",
    data: result,
  });
});

const updatePost = catchAsync(async (req, res) => {
  const result = await PostService.updatePost(req.user, req.params.id, req.body, req.files);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Post updated successfully",
    data: result,
  });
});

const cancelPost = catchAsync(async (req, res) => {
  const result = await PostService.cancelPost(req.user, req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Post cancelled successfully",
    data: result,
  });
});

const PostController = {
  createPost,
  getMyPosts,
  getPostById,
  getAllPosts,
  updatePost,
  cancelPost,
};

export default PostController;
