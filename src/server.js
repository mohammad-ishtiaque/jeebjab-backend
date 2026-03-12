import app from "./app.js";
import config from "./config/index.js";
import connectDB from "./connection/connectDB.js";
import { logger, errorLogger } from "./util/logger.js";

async function main() {
  try {
    await connectDB();

    const server = app.listen(config.port, config.base_url, () => {
      console.log(`🚀 Server is humming at http://${config.base_url}:${config.port}`);
      logger.info(`Server started on port ${config.port}`);
    });

    process.on("unhandledRejection", (error) => {
      errorLogger.error("Unhandled Rejection detected, shutting down...");
      if (server) {
        server.close(() => {
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    });

  } catch (error) {
    errorLogger.error("Failed to start server:", error);
  }
}

main();