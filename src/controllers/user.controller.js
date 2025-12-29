import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/user.model.js";
import Audit from "../models/audit.model.js";

export const addUser = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    if (!name || !email || !phone || !role) {
      return res.status(400).json({ message: "name, email, phone and role are required" });
    }
    const allowedRoles = ["hr", "interviewer"];
    if (!allowedRoles.includes(role.toLowerCase())) {
      return res.status(400).json({ message: "Invalid role. Allowed values: hr, interviewer" });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "User with this email already exists" });
    }
    // generate a temporary password
    const tempPassword = crypto.randomBytes(6).toString("hex");
    const hashed = await bcrypt.hash(tempPassword, 10);
    const newUser = new User({
      name,
      email,
      phone,
      role: role.toLowerCase(),
      password: hashed,
      createdBy: { id: req.user.id, name: req.user.name },
    });
    await newUser.save();
    // audit log
    try {
      await Audit.create({
        userId: req.user.id,
        role: req.user.role,
        action: "CREATE_USER",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        targetUserId: newUser._id,
      });
    } catch (e) {
      console.warn("Audit write failed", e);
    }
    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdBy: newUser.createdBy,
      },
    });
  } catch (err) {
    console.error("ADD USER ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
