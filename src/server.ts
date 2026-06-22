import app from "./app";
import mongoose from "mongoose";
import logger from "./utils/logger";

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/travelcopilot";

const startServer = async () => {
  try {
    logger.info("Connecting to MongoDB...");
    
    // Configure mongoose connection options
    mongoose.set("strictQuery", true);
    
    await mongoose.connect(MONGODB_URI);
    logger.info("Successfully connected to MongoDB.");
  } catch (error) {
    logger.error("Failed to connect to MongoDB. Ensure local MongoDB is running or configure MONGODB_URI.", error);
    logger.info("Starting API server anyway to allow health monitoring and mock interactions...");
  }

  app.listen(PORT, () => {
    logger.info(`=============================================================`);
    logger.info(`  TravelCopilot AI Backend service is listening on Port ${PORT}`);
    logger.info(`  Environment: ${process.env.NODE_ENV || "development"}`);
    logger.info(`  Access Health Check: http://localhost:${PORT}/health`);
    logger.info(`=============================================================`);
  });
};

startServer();
