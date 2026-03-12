import status from "http-status";
import User from "./User.js";
import QueryBuilder from "../../../builder/queryBuilder.js";
import ApiError from "../../../error/ApiError.js";
import validateFields from "../../../util/validateFields.js";

const postUser = async (userData, payload) => {
  // Add your logic here
};

const getUser = async (userData, query) => {
  validateFields(query, ["userId"]);

  const user = await User.findOne({
    _id: query.userId,
  }).lean();

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found");
  }

  return user;
};

const getAllUsers = async (userData, query) => {
  const userQuery = new QueryBuilder(
    User.find({}).lean(),
    query
  )
    .search([])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [users, meta] = await Promise.all([
    userQuery.modelQuery,
    userQuery.countTotal(),
  ]);

  return { meta, users };
};

const updateUser = async (userData, payload) => {
  // Add your logic here
};

const deleteUser = async (userData, payload) => {
  validateFields(payload, ["userId"]);

  const user = await User.deleteOne({
    _id: payload.userId,
  });

  if (!user.deletedCount) {
    throw new ApiError(status.NOT_FOUND, "User not found");
  }

  return user;
};

const UserService = {
  postUser,
  getUser,
  getAllUsers,
  updateUser,
  deleteUser,
};

export default UserService;