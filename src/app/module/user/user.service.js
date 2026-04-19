import status from "http-status";
import User from "./User.js";
import QueryBuilder from "../../../builder/queryBuilder.js";
import ApiError from "../../../error/ApiError.js";
import validateFields from "../../../util/validateFields.js";


const becomeDriver = async (userData, payload, files) => {
  const { driverType, vehicleType, vehicleBrand, vehicleModel, vehicleYear, licenseNumber, documents, companyId, companyDriverId } = payload;
  
  const user = await User.findById(userData.userId);
  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found");
  }
  
  if (user.roles.includes("driver")) {
    throw new ApiError(status.BAD_REQUEST, "User is already a driver");
  }

  

  const driverProfile = new driverProfile({
    userId: user._id,
    driverType,
    vehicleType,
    vehicleBrand,
    vehicleModel,
    vehicleYear,
    licenseNumber,
    documents: files.documents,
    companyId,
    companyDriverId,
  });

  await driverProfile.save();
  user.roles.push("driver");
  await user.save();

  return driverProfile;
}


const getUserProfile = async (userData) => {
  const user = await User.findById(userData.userId);
  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found");
  }
  return user;
}







const UserService = {
  becomeDriver,
  getUserProfile,
};

export default UserService;