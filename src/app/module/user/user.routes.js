import express from "express";
import auth from "../../middleware/auth.js";
import config from "../../../config.js";
import UserController from "./user.controller.js";

const router = express.Router();

router
  .post("/", auth(config.auth_level.user), UserController.postUser)
  .get("/:id", auth(config.auth_level.user), UserController.getUser)
  .get("/", auth(config.auth_level.user), UserController.getAllUsers)
  .patch("/:id", auth(config.auth_level.user), UserController.updateUser)
  .delete("/:id", auth(config.auth_level.user), UserController.deleteUser);

export default router;