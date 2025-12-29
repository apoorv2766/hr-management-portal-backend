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
      required: true,
    },
    expectedCtc: {
      type: String,
      required: true,
    },
    experience: {
      type: String,
      required: true,
    },
    round: {
      type: String,
      required: true,
      trim: true,
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    interviewDateTime: {
      type: Date,
      required: true,
    },
    meetingLink: {
      type: String,
      required: true,
    },
    assignedInterviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    interviewResult: {
      type: String,
      enum: [
        "Lack of knowledge",
        "Not joined",
        "Need to do 2nd round",
        "Offer sent",
        "Offer accepted",
        "Offer declined",
      ],
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
