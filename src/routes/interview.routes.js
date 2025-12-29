import express from "express";
import {
  createInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview,
  assignInterviewer,
} from "../controllers/interview.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/create", authMiddleware, roleMiddleware("admin", "hr"), createInterview);
router.get("/list", authMiddleware, getInterviews);
router.get("/:id", authMiddleware, getInterviewById);
router.put("/:id", authMiddleware, roleMiddleware("admin", "hr"), updateInterview);
router.post("/assign-interviewer", authMiddleware, roleMiddleware("admin", "hr"), assignInterviewer);
router.delete("/:id", authMiddleware, roleMiddleware("admin", "hr"), deleteInterview);

export default router;
