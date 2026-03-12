import httpStatus from "http-status";
import emitError from "../socket/emitError.js";

/**
 * Validates required fields in socket event payloads
 */
const validateSocketFields = (socket, payload, requiredFields) => {
  if (!payload) {
    return emitError(socket, httpStatus.BAD_REQUEST, "Request payload is required");
  }

  for (const field of requiredFields) {
    const value = payload[field];
    
    if (
      value === undefined || 
      value === null || 
      (typeof value === "string" && value.trim() === "")
    ) {
      return emitError(socket, httpStatus.BAD_REQUEST, `${field} is required`);
    }
  }
};

export default validateSocketFields;