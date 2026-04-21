import status from "http-status";
import User from "./User.js";
import ApiError from "../../../error/ApiError.js";
import validateFields from "../../../util/validateFields.js";
import config from "../../../config/index.js";

// These field names in the multipart form map 1-to-1 to docType values
const DRIVER_DOC_FIELDS = [
  "driving_license",
  "vehicle_registration",
  "insurance",
  "id_proof",
  "company_id",
  "other",
];

const becomeDriver = async (userData, payload, files) => {
  const {
    driverType,
    vehicleType,
    vehicleBrand,
    vehicleModel,
    vehicleYear,
    licenseNumber,
    companyId,
    companyName,
    companyDriverId,
  } = payload;

  validateFields(payload, ["driverType", "vehicleType", "licenseNumber"]);

  if (!["independent", "company"].includes(driverType)) {
    throw new ApiError(status.BAD_REQUEST, "driverType must be 'independent' or 'company'");
  }

  if (driverType === "company") {
    validateFields(payload, ["companyId", "companyName"]);
  }

  const user = await User.findById(userData.userId);
  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found");
  }

  if (user.driverProfile !== null) {
    const currentStatus = user.driverProfile.approvalStatus;
    if (currentStatus === "pending") {
      throw new ApiError(status.BAD_REQUEST, "Driver application already submitted and is pending review");
    }
    if (currentStatus === "approved") {
      throw new ApiError(status.BAD_REQUEST, "User is already an approved driver");
    }
    // "rejected" — allow re-application
  }

  // Build documents array: field name = docType, so no separate docTypes param needed
  const documents = [];
  if (files) {
    for (const docType of DRIVER_DOC_FIELDS) {
      const uploaded = files[docType];
      if (uploaded?.length > 0) {
        for (const file of uploaded) {
          documents.push({
            docType,
            url: `${config.base_url}/uploads/${docType}/${file.filename}`,
            uploadedAt: new Date(),
          });
        }
      }
    }
  }

  user.driverProfile = {
    driverType,
    vehicleType,
    vehicleBrand: vehicleBrand || null,
    vehicleModel: vehicleModel || null,
    vehicleYear: vehicleYear ? Number(vehicleYear) : null,
    licenseNumber,
    documents,
    companyId: driverType === "company" ? companyId : null,
    companyName: driverType === "company" ? companyName : "",
    companyDriverId: companyDriverId || null,
    approvalStatus: "pending",
    isAvailable: false,
    averageRating: 0,
    totalRatings: 0,
    totalDeliveries: 0,
  };

  await user.save();
  return user;
};


const getUserProfile = async (userData) => {
  const user = await User.findById(userData.userId);
  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found");
  }
  return user;
};


const UserService = {
  becomeDriver,
  getUserProfile,
};

export default UserService;
