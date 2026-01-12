import express from "express";
import {
  addUser,
  getUserByRole,
  getUsers,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { activityTracker } from "../middlewares/activity.middleware.js";

const router = express.Router();

router.post("/adduser", authMiddleware, activityTracker({ entityType: "user" }), addUser);
router.get("/get-user-by-role", authMiddleware, getUserByRole);
router.get("/users", authMiddleware, getUsers);
router.put("/updateuser/:id", authMiddleware, activityTracker({ entityType: "user" }), updateUser);
router.delete("/deleteuser/:id", authMiddleware, activityTracker({ entityType: "user" }), deleteUser);

export default router;
