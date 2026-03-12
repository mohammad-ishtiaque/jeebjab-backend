import { Error as MongooseError } from "mongoose";
import jwt from "jsonwebtoken";
const { JsonWebTokenError, TokenExpiredError } = jwt;
import multer from "multer";
const { MulterError } = multer;

import config from "../../config/index.js";
import ApiError from "../../error/ApiError.js";
import handleValidationError from "../../error/handleValidationError.js";
import handleCastError from "../../error/handleCastError.js";
import handleMulterError from "../../error/handleMulterError.js";
import createErrorMessage from "../../util/createErrorMessage.js";
import { errorLogger } from "../../util/logger.js";

const globalErrorHandler = (error, req, res, next) => {
  // 1. Centralized Logging
  errorLogger.error(`[Global Error Handler] ${error.message}`, { 
    stack: error.stack, 
    path: req.originalUrl 
  });

  // 2. Default Fallback Values
  let statusCode = error.statusCode || 500;
  let message = error.message || "Something went wrong!";
  let errorMessages = createErrorMessage(message);

  // 3. Precise Error Routing (Fast & Memory Efficient)
  if (error.name === "ValidationError") {
    const handled = handleValidationError(error);
    statusCode = handled.statusCode || 400;
    message = handled.message;
    errorMessages = handled.errorMessages;
  } 
  else if (error.name === "CastError") {
    const handled = handleCastError(error);
    statusCode = handled.statusCode || 400;
    message = handled.message;
    errorMessages = handled.errorMessages;
  } 
  else if (error.code === 11000) {
    // MongoDB Duplicate Key Error
    const field = Object.keys(error.keyValue)[0];
    statusCode = 409;
    message = `${field} must be unique.`;
    errorMessages = createErrorMessage(message, field);
  } 
  else if (error instanceof JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
    errorMessages = createErrorMessage(message);
  } 
  else if (error instanceof TokenExpiredError) {
    statusCode = 401;
    message = "Your token has expired. Please log in again.";
    errorMessages = createErrorMessage(message);
  } 
  else if (error instanceof ApiError) {
    statusCode = error.statusCode || 500;
    message = error.message;
    errorMessages = createErrorMessage(error.message);
  } 
  else if (error instanceof MulterError) {
    const handled = handleMulterError(error);
    statusCode = handled.statusCode;
    message = handled.message;
    errorMessages = handled.errorMessages;
  }

  // 4. Fallback Status Check (Failsafe)
  if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
    statusCode = 500;
  }

  // 5. Final Client Response
  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    // Only send raw stack trace in development for security
    stack: config.env !== "production" ? error.stack : undefined,
  });
};

export default globalErrorHandler;