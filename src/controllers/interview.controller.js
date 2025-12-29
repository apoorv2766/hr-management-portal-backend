import Interview from "../models/interview.model.js";
import Audit from "../models/audit.model.js";
import User from "../models/user.model.js";
import { parseAndConvertToIST } from "../utils/datetime.js";
import { interviewStatuses } from "../utils/constants.js";

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
    } = req.body;

    // Validate required fields
    const requiredFields = [
      "candidateName",
      "email",
      "phone",
      "position",
      "currentCtc",
      "expectedCtc",
      "experience",
      "round",
      "joiningDate",
      "interviewDateTime",
      "meetingLink",
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

    // Convert dates to IST
    let joiningDateIST;
    let interviewDateTimeIST;

    try {
      joiningDateIST = parseAndConvertToIST(joiningDate);
      interviewDateTimeIST = parseAndConvertToIST(interviewDateTime);
    } catch (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

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
          "An interview is already scheduled for this candidate around the same time",
        existingInterview: {
          id: existingInterview._id,
          candidateName: existingInterview.candidateName,
          interviewDateTime: existingInterview.interviewDateTime,
        },
      });
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
      meetingLink: meetingLink.trim(),
      createdBy: {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role,
      },
    });

    await newInterview.save();

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

    // Fetch interviewer users to surface available interviewers in the response
    const interviewers = await User.find({ role: "interviewer" }).select(
      "name"
    );

    return res.status(200).json({
      message: "Interviews fetched successfully",
      count: interviews.length,
      interviews,
      interviewers,
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
      status,
    } = req.body;

    // Find existing interview
    const existingInterview = await Interview.findById(id);
    if (!existingInterview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    // Build update object (only include provided fields)
    const updateData = {};

    if (candidateName !== undefined)
      updateData.candidateName = candidateName.trim();
    if (email !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: "Invalid email format",
        });
      }
      updateData.email = email.toLowerCase().trim();
    }
    if (phone !== undefined) {
      // Validate phone format
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          message: "Invalid phone number. Must be 10 digits",
        });
      }
      updateData.phone = phone.trim();
    }
    if (position !== undefined) updateData.position = position.trim();
    if (currentCtc !== undefined) updateData.currentCtc = currentCtc;
    if (expectedCtc !== undefined) updateData.expectedCtc = expectedCtc;
    if (experience !== undefined) updateData.experience = experience;
    if (round !== undefined) updateData.round = round.trim();
    if (meetingLink !== undefined) updateData.meetingLink = meetingLink.trim();

    // Handle date fields with IST conversion
    if (joiningDate !== undefined) {
      try {
        updateData.joiningDate = parseAndConvertToIST(joiningDate);
      } catch (error) {
        return res.status(400).json({
          message: `Invalid joiningDate: ${error.message}`,
        });
      }
    }

    if (interviewDateTime !== undefined) {
      try {
        updateData.interviewDateTime = parseAndConvertToIST(interviewDateTime);
      } catch (error) {
        return res.status(400).json({
          message: `Invalid interviewDateTime: ${error.message}`,
        });
      }
    }

    // Validate status if provided
    if (status !== undefined) {
      if (!interviewStatuses.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Allowed values: ${interviewStatuses.join(
            ", "
          )}`,
        });
      }
      updateData.status = status;
    }

    // Update the interview
    const updatedInterview = await Interview.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

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
    // Audit log for delete
    try {
      await Audit.create({
        userId: req.user.id,
        role: req.user.role,
        action: "DELETE_INTERVIEW",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        details: {
          interviewId: interview._id,
          candidateName: interview.candidateName,
          email: interview.email,
          position: interview.position,
        },
      });
    } catch (auditError) {
      console.error(auditError);
    }

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
