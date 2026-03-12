import deleteUploadedFiles from "./deleteUploadedFiles.js";
import { errorLogger } from "../util/logger.js";

const catchAsync = (fn) => {
  return async (req, res, next) => {
    try {
      return await fn(req, res, next);
    } catch (error) {
      if (req.uploadedFiles) {
        deleteUploadedFiles(req.uploadedFiles);
      }
      errorLogger.error("Error caught in catchAsync middleware:", error);
      next(error);
    }
  };
};

export default catchAsync;