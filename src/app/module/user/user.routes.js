import express from "express";
import auth from "../../middleware/auth.js";
import config from "../../../config/index.js";
import UserController from "./user.controller.js";
import fileUploader from "../../middleware/fileUploader.js";

const router = express.Router();

router
  .post("/become-driver", auth(config.auth_level.user), fileUploader.uploadFile(), UserController.becomeDriver)
  .get("/user-profile", auth(config.auth_level.user), UserController.getUserProfile)


export default router;