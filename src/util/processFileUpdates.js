import fs from "fs/promises";
import { errorLogger } from "./logger.js";

/**
 * Deletes a file safely
 * @param {string} filePath 
 */
const unlinkFile = async (filePath) => {
  try {
    if (filePath) await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      errorLogger.error(`File unlink failed: ${filePath} - ${error.message}`);
    }
  }
};

const processFileUpdates = async (files = {}, fileFields) => {
  const updateData = {};

  for (const { key, oldPath } of fileFields) {
    // Check if new files are uploaded for this field
    if (!files[key]?.length) continue;

    // Handle array of old files
    if (Array.isArray(oldPath)) {
      updateData[key] = files[key].map((file) => file.path);
      
      await Promise.allSettled(
        oldPath.map((path) => unlinkFile(path))
      );
    } else {
      // Handle single old file
      updateData[key] = files[key][0].path;
      if (oldPath) await unlinkFile(oldPath);
    }
  }

  return updateData;
};

export default processFileUpdates;