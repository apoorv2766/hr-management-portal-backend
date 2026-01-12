import Interview from "../models/interview.model.js";
import User from "../models/user.model.js";
import Interviews from "../models/interview.model.js";
import { parseAndConvertToIST } from "../utils/datetime.js";
import { sendInterviewMail } from "../utils/email.js";
import mongoose from "mongoose";

export const createInterview = async (req, res) => {
  try {
    const {
      candidateName,
      email,
      phone,
      position,
      currentCtc,
      expectedCtc,
      experience,
      round,
      joiningDate,
      interviewDateTime,
      meetingLink,
      currentCompany,
      noticePeriod,
    } = req.body;

    // Validate required fields
    const requiredFields = [
      "candidateName",
      "email",
      "phone",
      "round",
      "position",
    ];

    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Missing required fields",
        missingFields,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // Validate phone format (basic validation for 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        message: "Invalid phone number. Must be 10 digits",
      });
    }

    // Convert dates to IST (only if provided)
    let joiningDateIST;
    let interviewDateTimeIST;

    if (joiningDate) {
      try {
        joiningDateIST = parseAndConvertToIST(joiningDate);
      } catch (error) {
        return res.status(400).json({
          message: error.message,
        });
      }
    }

    if (interviewDateTime) {
      try {
        interviewDateTimeIST = parseAndConvertToIST(interviewDateTime);

        // Validate that interview date is not in the past
        const now = new Date();
        if (interviewDateTimeIST < now) {
          return res.status(400).json({
            message: "Interview date and time cannot be in the past",
          });
        }

        // Check for duplicate interview (same email and similar date/time)
        const existingInterview = await Interview.findOne({
          email: email.toLowerCase(),
          interviewDateTime: {
            $gte: new Date(interviewDateTimeIST.getTime() - 30 * 60000), // 30 mins before
            $lte: new Date(interviewDateTimeIST.getTime() + 30 * 60000), // 30 mins after
          },
          status: { $ne: "cancelled" },
        });

        if (existingInterview) {
          return res.status(409).json({
            message:
              "Interview is already scheduled for this candidate for same time",
            existingInterview: {
              id: existingInterview._id,
              candidateName: existingInterview.candidateName,
              interviewDateTime: existingInterview.interviewDateTime,
            },
          });
        }
      } catch (error) {
        return res.status(400).json({
          message: error.message,
        });
      }
    }

    // Create new interview
    const newInterview = new Interview({
      candidateName: candidateName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      position: position.trim(),
      currentCtc,
      expectedCtc,
      experience,
      round: round.trim(),
      joiningDate: joiningDateIST,
      interviewDateTime: interviewDateTimeIST,
      meetingLink: meetingLink?.trim(),
      currentCompany: currentCompany?.trim(),
      noticePeriod: noticePeriod?.trim(),
      createdBy: {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role,
      },
    });

    await newInterview.save();

    // Provide activity payload for middleware
    res.locals.activity = {
      action: "CREATE_INTERVIEW",
      entityType: "interview",
      entityId: newInterview._id,
      entityName: `${newInterview.candidateName} - ${newInterview.position}`,
      description: `Scheduled interview for ${newInterview.candidateName} for ${newInterview.position} on ${newInterview.interviewDateTime}`,
      targetUserId: null,
    };

    // Send email asynchronously (don't wait for it to complete)
    if (
      (round === "1st round" || round === "2nd round") &&
      interviewDateTimeIST &&
      meetingLink
    ) {
      sendInterviewMail(
        candidateName,
        email,
        position,
        interviewDateTimeIST,
        meetingLink,
        round
      ).catch((error) => console.error("Email sending failed:", error));
    }

    return res.status(201).json({
      message: "Interview scheduled successfully",
      interview: {
        id: newInterview._id,
        candidateName: newInterview.candidateName,
        email: newInterview.email,
        phone: newInterview.phone,
        position: newInterview.position,
        currentCtc: newInterview.currentCtc,
        expectedCtc: newInterview.expectedCtc,
        experience: newInterview.experience,
        round: newInterview.round,
        joiningDate: newInterview.joiningDate,
        interviewDateTime: newInterview.interviewDateTime,
        meetingLink: newInterview.meetingLink,
        currentCompany: newInterview.currentCompany,
        noticePeriod: newInterview.noticePeriod,
        status: newInterview.status,
        createdBy: newInterview.createdBy,
        createdAt: newInterview.createdAt,
      },
    });
  } catch (error) {
    console.error("CREATE INTERVIEW ERROR:", error);
  }
};

export const getInterviews = async (req, res) => {
  try {
    const { status, position, email, startDate, endDate } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (position) {
      filter.position = { $regex: position, $options: "i" };
    }
    if (email) {
      filter.email = email.toLowerCase();
    }
    if (startDate || endDate) {
      filter.interviewDateTime = {};
      if (startDate) {
        filter.interviewDateTime.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.interviewDateTime.$lte = new Date(endDate);
      }
    }
    const interviews = await Interview.find(filter)
      .sort({ interviewDateTime: -1 })
      .select("-__v");
    return res.status(200).json({
      message: "Interviews fetched successfully",
      count: interviews.length,
      interviews,
    });
  } catch (error) {
    console.error("GET INTERVIEWS ERROR:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getInterviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const interview = await Interview.findById(id).select("-__v");

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    return res.status(200).json({
      message: "Interview fetched successfully",
      interview,
    });
  } catch (error) {
    console.error("GET INTERVIEW BY ID ERROR:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const updateInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedInterview = await Interview.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("assignedInterviewer", "name email role")
      .select("-__v -interviewResult");

    if (!updatedInterview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }
    // Send email asynchronously (don't wait for it to complete)
    if (
      (req.body.round === "1st round" || req.body.round === "2nd round") &&
      updatedInterview.interviewDateTime &&
      updatedInterview.meetingLink
    ) {
      sendInterviewMail(
        updatedInterview.candidateName,
        updatedInterview.email,
        updatedInterview.position,
        updatedInterview.interviewDateTime,
        updatedInterview.meetingLink,
        updatedInterview.round
      ).catch((error) => console.error("Email sending failed:", error));
    }

    // Provide activity payload for middleware
    res.locals.activity = {
      action: "UPDATE_INTERVIEW",
      entityType: "interview",
      entityId: updatedInterview._id,
      entityName: `${updatedInterview.candidateName} - ${updatedInterview.position}`,
      description: `Updated interview for ${updatedInterview.candidateName}`,
      targetUserId: null,
    };

    return res.status(200).json({
      message: "Interview updated successfully",
      interview: updatedInterview,
    });
  } catch (error) {
    console.error("UPDATE INTERVIEW ERROR:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const deleteInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findByIdAndDelete(id);
    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    // Provide activity payload for middleware
    res.locals.activity = {
      action: "DELETE_INTERVIEW",
      entityType: "interview",
      entityId: interview._id,
      entityName: `${interview.candidateName} - ${interview.position}`,
      description: `Deleted interview for ${interview.candidateName}`,
      targetUserId: null,
    };

    return res.status(200).json({
      message: "Interview deleted successfully",
      deleted: {
        id: interview._id,
        candidateName: interview.candidateName,
        email: interview.email,
        position: interview.position,
      },
    });
  } catch (error) {
    console.error("DELETE INTERVIEW ERROR:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const assignInterviewer = async (req, res) => {
  try {
    const { candidateId, interviewerId } = req.body;

    if (!candidateId || !interviewerId) {
      return res.status(400).json({
        message: "candidateId and interviewerId are required",
      });
    }

    // Validate candidateId
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({
        message: "Invalid candidateId",
      });
    }

    // Validate interviewerId
    if (!mongoose.Types.ObjectId.isValid(interviewerId)) {
      return res.status(400).json({
        message: "Invalid interviewerId",
      });
    }

    // Check if interview exists
    const interview = await Interview.findById(candidateId);
    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    // Check if interviewer exists and has interviewer role
    const interviewer = await User.findById(interviewerId);
    if (!interviewer) {
      return res.status(404).json({
        message: "Interviewer not found",
      });
    }

    if (interviewer.role !== "interviewer") {
      return res.status(400).json({
        message: "User is not an interviewer",
      });
    }

    // Update interview with assigned interviewer
    interview.assignedInterviewer = interviewerId;
    await interview.save();

    // Populate the assigned interviewer details
    await interview.populate("assignedInterviewer", "name email role");

    // Provide activity payload for middleware
    res.locals.activity = {
      action: "ASSIGN_INTERVIEWER",
      entityType: "interview",
      entityId: interview._id,
      entityName: `${interview.candidateName} - ${interview.position}`,
      description: `Assigned ${interviewer.name} as interviewer for ${interview.candidateName}`,
      targetUserId: interviewerId,
    };

    return res.status(200).json({
      message: "Interviewer assigned successfully",
      interview: {
        id: interview._id,
        candidateName: interview.candidateName,
        position: interview.position,
        interviewDateTime: interview.interviewDateTime,
        assignedInterviewer: interview.assignedInterviewer,
      },
    });
  } catch (error) {
    console.error("ASSIGN INTERVIEWER ERROR:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const checkEmailExists = async (req, res) => {
  try {
    const { email } = req.body;
    const existing = await Interviews.findOne({ email });
    if (existing) {
      return res.json({ exists: true, message: "Email already exists" });
    }
    return res.json({ exists: false, message: "You can procces to add email" });
  } catch (error) {
    return res.status(500).json({ exists: false });
  }
};

export const checkPhoneExists = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.json({ exists: false });
    }
    const existing = await Interviews.findOne({ phone: phone.trim() });
    if (existing) {
      return res.json({
        exists: true,
        message: "Phone Number already exists",
      });
    }
    return res.json({
      exists: false,
      message: "Phone number is available",
    });
  } catch (error) {
    console.error("Error checking phone:", error);
  }
};
