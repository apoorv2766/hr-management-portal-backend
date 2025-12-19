import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: {
      type: String,
      enum: ["admin", "hr", "interviewer"],
      required: true
    },
    refreshToken: String
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
