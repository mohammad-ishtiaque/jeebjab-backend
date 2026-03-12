import httpStatus from "http-status";
import ApiError from "../error/ApiError.js";

const validateFields = (payload, requiredFields) => {
  if (!payload) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Request body is missing");
  }

  for (const field of requiredFields) {
    if (!payload[field] || (typeof payload[field] === "string" && !payload[field].trim())) {
      throw new ApiError(httpStatus.BAD_REQUEST, `${field} is required`);
    }
  }
};

export default validateFields;