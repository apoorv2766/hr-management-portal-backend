import express from "express";
import { addUser } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/adduser", authMiddleware, addUser);

export default router;
