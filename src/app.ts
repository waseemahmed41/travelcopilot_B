import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { errorHandler } from "./middlewares/error.middleware";
import authRoutes from "./routes/auth.routes";
import tripRoutes from "./routes/trip.routes";
import dsaRoutes from "./routes/dsa.routes";

// Load environment variables
dotenv.config();

const app = express();

// Security middlewares
app.use(helmet());
app.use(
  cors({
    origin: "*", // Adjust in production to allow specific domains
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Standard parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check API
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "TravelCopilot AI Backend is healthy",
    timestamp: new Date()
  });
});

// API Route registries
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/dsa", dsaRoutes);

// Unhandled Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `Cannot find ${req.method} ${req.originalUrl} on this server`
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
