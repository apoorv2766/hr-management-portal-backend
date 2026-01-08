import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Audit from "../models/audit.model.js";
import { allowedRoles, defaultPassword } from "../utils/constants.js";

export const addUser = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    if (!name || !email || !phone || !role) {
      return res
        .status(400)
        .json({ message: "name, email, phone and role are required" });
    }
    if (!allowedRoles.includes(role.toLowerCase())) {
      return res
        .status(400)
        .json({ message: "Invalid role. Allowed values: hr, interviewer" });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ message: "User with this email already exists" });
    }
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const newUser = new User({
      name,
      email,
      phone,
      role: role.toLowerCase(),
      password: hashedPassword,
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

export const getUserByRole = async (req, res) => {
  try {
    const { role } = req.query;

    if (!role) {
      return res.status(400).json({
        message: "Role query parameter is required",
      });
    }

    if (!allowedRoles.includes(role.toLowerCase())) {
      return res.status(400).json({
        message: `Invalid role. Allowed values: ${allowedRoles.join(", ")}`,
      });
    }

    const users = await User.find({ role: role.toLowerCase() }).select(
      "name email role"
    );

    return res.status(200).json({
      message: `Users with role '${role}' fetched successfully`,
      count: users.length,
      users,
    });
  } catch (err) {
    console.error("GET USERS BY ROLE ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -refreshToken");

    return res.status(200).json({
      message: "Users fetched successfully",
      count: users.length,
      users,
    });
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role } = req.body;

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (role && !allowedRoles.includes(role.toLowerCase())) {
      return res.status(400).json({
        message: `Invalid role. Allowed values: ${allowedRoles.join(", ")}`,
      });
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: "Email already exists" });
      }
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role.toLowerCase();

    await user.save();

    // audit log
    try {
      await Audit.create({
        userId: req.user.id,
        role: req.user.role,
        action: "UPDATE_USER",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        targetUserId: user._id,
      });
    } catch (e) {
      console.warn("Audit write failed", e);
    }

    return res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("UPDATE USER ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await User.findByIdAndDelete(id);
    try {
      await Audit.create({
        userId: req.user.id,
        role: req.user.role,
        action: "DELETE_USER",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        targetUserId: user._id,
      });
    } catch (e) {
      console.warn("Audit write failed", e);
    }
    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
