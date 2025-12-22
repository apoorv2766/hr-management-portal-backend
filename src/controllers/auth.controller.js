import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Audit from "../models/audit.model.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";

// export const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const match = await bcrypt.compare(password, user.password);
//     if (!match) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const accessToken = generateAccessToken(user);
//     const refreshToken = generateRefreshToken(user);

//     user.refreshToken = refreshToken;
//     await user.save();

//     res.cookie("refreshToken", refreshToken, {
//       httpOnly: true,
//       sameSite: "strict",
//       secure: process.env.NODE_ENV === "production",
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//       path: "/",
//     });

//     await Audit.create({
//       userId: user._id,
//       role: user.role,
//       action: "LOGIN",
//       ip: req.ip,
//       userAgent: req.headers["user-agent"],
//     });

//     return res.status(200).json({
//       accessToken,

//       user: {
//         id: user._id,
//         name: user.name,
//         role: user.role,
//       },
//        message: "Login successful",
//     });
//   } catch (err) {
//     console.error("LOGIN ERROR:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
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
    await user.save();
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
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
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(401);
  const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  const user = await User.findById(payload.id);
  if (!user || user.refreshToken !== token) return res.sendStatus(403);
  res.json({ accessToken: generateAccessToken(user) });
};

export const logout = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    const user = await User.findOne({ refreshToken: token });
    if (user) {
      user.refreshToken = null;
      await user.save();
      await Audit.create({
        userId: user._id,
        role: user.role,
        action: "LOGOUT",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });
    }
  }
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logged out successfully" });
};
