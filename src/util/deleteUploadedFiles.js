import fs from "fs/promises";
import { errorLogger } from "./logger.js";

const deleteUploadedFiles = async (uploadedFiles) => {
  if (!uploadedFiles?.length) return;

  await Promise.allSettled(
    uploadedFiles.map(async (filePath) => {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // ENOENT = file doesn't exist, not a real error
        if (error.code !== "ENOENT") {
          errorLogger.error(`Failed to delete file: ${filePath}`, error);
        }
      }
    })
  );
};

export default deleteUploadedFiles;