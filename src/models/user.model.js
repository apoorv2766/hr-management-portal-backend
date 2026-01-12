import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phone: { type: String },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "hr", "interviewer"],
      required: true,
    },
    createdBy: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String },
    },
     updatedBy: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String },
    },
    refreshToken: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
