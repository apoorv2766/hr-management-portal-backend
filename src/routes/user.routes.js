import express from "express";
import {
  addUser,
  getUserByRole,
  getUsers,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/adduser", authMiddleware, addUser);
router.get("/get-user-by-role", authMiddleware, getUserByRole);
router.get("/users", authMiddleware, getUsers);
router.put("/updateuser/:id", authMiddleware, updateUser);
router.delete("/deleteuser/:id", authMiddleware, deleteUser);

export default router;
