import express from "express";
import { getUserActivityTimeline } from "../controllers/activity.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/user/:userId", authMiddleware, getUserActivityTimeline);

export default router;
