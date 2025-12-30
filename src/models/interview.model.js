import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    candidateName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    currentCtc: {
      type: String,
    },
    expectedCtc: {
      type: String,
    },
    experience: {
      type: String,
    },
    round: {
      type: String,
      required: true,
      trim: true,
    },
    joiningDate: {
      type: Date,
    },
    interviewDateTime: {
      type: Date,
    },
    meetingLink: {
      type: String,
    },
    currentCompany: {
      type: String,
    },
    noticePeriod: {
      type: String,
    },
    assignedInterviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      default: null,
    },
    createdBy: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String },
      role: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
interviewSchema.index({ email: 1, interviewDateTime: 1 });
interviewSchema.index({ status: 1 });

export default mongoose.model("Interview", interviewSchema);
