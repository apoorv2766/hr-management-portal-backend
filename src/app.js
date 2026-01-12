import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import activityRoutes from "./routes/activity.routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.DEVELOPMENT_URL, credentials: true }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/interview", interviewRoutes);
app.use("/api/v1/activity", activityRoutes);

export default app;
