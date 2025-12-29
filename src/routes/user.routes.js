import express from "express";
import { addUser, getUserByRole } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/adduser", authMiddleware, addUser);
router.get("/get-user-by-role", authMiddleware, getUserByRole);

export default router;
