import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Audit from "../models/audit.model.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email && !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;
    user.accessToken = accessToken;
    await user.save();
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    await Audit.create({
      userId: user._id,
      role: user.role,
      action: "LOGIN",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    return res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
      message: "Login successful",
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


export const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      res.clearCookie("refreshToken");
      return res.status(401).json({ message: "Not authenticated" });
    }
    let payload;
    try {
      payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      res.clearCookie("refreshToken");
      return res.status(401).json({ message: "Refresh token expired" });
    }
    const user = await User.findById(payload.id);
    if (!user || user.refreshToken !== token) {
      res.clearCookie("refreshToken");
      return res.status(403).json({ message: "Invalid refresh token" });
    }
    const accessToken = generateAccessToken(user);
    return res.status(200).json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const user = await User.findOne({ refreshToken: refreshToken });
      if (refreshToken) {
        await User.updateOne({ refreshToken }, { $unset: { refreshToken: 1 } });
      }
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error during logout" });
  }
};
