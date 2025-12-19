import { Router } from "express";
import {
  login,
  refresh,
  logout
} from "../controllers/auth.controller.js";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

router.get("/admin", auth, role("admin"), (req, res) => {
  res.json("Admin route");
});

export default router;
