import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    role: String,
    action: String,
    ip: String,
    userAgent: String
  },
  { timestamps: true }
);

export default mongoose.model("Audit", auditSchema);
