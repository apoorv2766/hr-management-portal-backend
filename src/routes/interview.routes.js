import express from "express";
import {
  createInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview,
  assignInterviewer,
  checkEmailExists,
  checkPhoneExists,
} from "../controllers/interview.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { activityTracker } from "../middlewares/activity.middleware.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  roleMiddleware("admin", "hr"),
  activityTracker({ entityType: "interview" }),
  createInterview
);
router.get("/list", authMiddleware, getInterviews);
router.get("/:id", authMiddleware, getInterviewById);
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "hr", "interviewer"),
  activityTracker({ entityType: "interview" }),
  updateInterview
);
router.post(
  "/assign-interviewer",
  authMiddleware,
  roleMiddleware("admin", "hr"),
  activityTracker({ entityType: "interview" }),
  assignInterviewer
);
router.post("/check-email", authMiddleware, checkEmailExists);
router.post("/check-phone", authMiddleware, checkPhoneExists);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "hr"),
  activityTracker({ entityType: "interview" }),
  deleteInterview
);

export default router;
