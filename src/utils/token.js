import jwt from "jsonwebtoken";

export const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );

export const generateRefreshToken = (user) =>
  jwt.sign( 
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );

export const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

