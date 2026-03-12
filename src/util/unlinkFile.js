import fs from "fs/promises";
import httpStatus from "http-status";
import ApiError from "../error/ApiError.js";

const unlinkFile = async (filePath) => {
  try {
    if (!filePath) {
      throw new ApiError(httpStatus.BAD_REQUEST, "File path is required for deletion");
    }

    // ফাইলটি আসলে আছে কিনা চেক করা (Access check)
    await fs.access(filePath);

    // ফাইল ডিলিট করা
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    // যদি ফাইল না পাওয়া যায় (ENOENT), তবে এরর থ্রো করার দরকার নেই
    if (error.code !== "ENOENT") {
      console.error(`Error deleting file at ${filePath}:`, error);
    }
    return false;
  }
};

export default unlinkFile;