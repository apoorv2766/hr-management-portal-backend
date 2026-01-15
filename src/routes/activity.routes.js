import express from "express";
import { getUserActivityTimeline, getInterviewActivityTimeline } from "../controllers/activity.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/user/:userId", authMiddleware, getUserActivityTimeline);
router.get("/interview/:interviewId", authMiddleware, getInterviewActivityTimeline);

export default router;
