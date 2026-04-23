import express from "express";
import auth from "../../middleware/auth.js";
import config from "../../../config/index.js";
import fileUploader from "../../middleware/fileUploader.js";
import PostController from "./post.controller.js";

const router = express.Router();

router
  // Jobs feed — drivers browse pending posts (auth optional: pass isAccessible=false to allow guests)
  .get("/", auth(config.auth_level.user), PostController.getAllPosts)

  // My Post tab — user's own posts filtered by ?status=pending|active|completed|cancelled
  .get("/my-posts", auth(config.auth_level.user), PostController.getMyPosts)

  // Single post detail
  .get("/:id", auth(config.auth_level.user), PostController.getPostById)

  // Create post — multipart/form-data: send post data as JSON string in field "data", images in "post_image"
  .post("/", auth(config.auth_level.user), fileUploader.uploadFile(), PostController.createPost)

  // Edit post (pending only) — same multipart format as create
  .patch("/:id", auth(config.auth_level.user), fileUploader.uploadFile(), PostController.updatePost)

  // Cancel post (pending or active)
  .patch("/:id/cancel", auth(config.auth_level.user), PostController.cancelPost);

export default router;
