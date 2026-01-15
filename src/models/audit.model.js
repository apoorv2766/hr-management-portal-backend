import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    userId: { //login user who performed the action
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, 
    userName: { type: String },// to whom the task will perform
    userRole: { type: String },
    action: { type: String }, // e.g., CREATE_USER, UPDATE_USER, DELETE_USER, CREATE_INTERVIEW
    entityType: { type: String }, // e.g., "user", "interview"
    entityId: { type: mongoose.Schema.Types.ObjectId },
    entityName: { type: String },
    fieldName: { type: String },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    description: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    targetUserId: { type: mongoose.Schema.Types.ObjectId }, // affected user if applicable
  },
  { timestamps: true }
);

// Indexes for faster queries
auditSchema.index({ userId: 1, createdAt: -1 });
auditSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model("Audit", auditSchema);
