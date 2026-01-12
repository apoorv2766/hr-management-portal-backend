import mongoose from "mongoose";
import User from "../models/user.model.js";
import Audit from "../models/audit.model.js";
import { logActivity } from "../utils/activityTracker.js";
import { formatActivityEntry } from "../utils/activityFormatter.js";

export const createUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, description, fieldName, oldValue, newValue } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: action || "CUSTOM_ACTION",
      entityType: "user",
      entityId: targetUser._id,
      entityName: targetUser.name,
      fieldName: fieldName || null,
      oldValue: oldValue || null,
      newValue: newValue || null,
      description: description || null,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      targetUserId: targetUser._id,
    });

    return res.status(201).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    console.error("CREATE USER ACTIVITY ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserActivityTimeline = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100, skip = 0 } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    const userExists = await User.findById(userId).select("_id");
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }
    const activities = await Audit.find({
      $or: [{ entityType: "user", entityId: userId }, { targetUserId: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();
    const formatted = activities.map((activity) => ({
      activityId: activity._id,
      loginId: activity.userId,
      performedBy: activity.userName,
      performedByRole: activity.userRole,
      performedFor: activity.entityName,
      performedForId: activity.entityId,
      actionType: activity.action,
      fieldChanged: activity.fieldName,
      oldValue: activity.oldValue,
      newValue: activity.newValue,
      description: activity.description,
      message: formatActivityEntry(activity),
      performedAt: activity.createdAt,
    }));
    return res.status(200).json({
      message: "User activity timeline fetched successfully",
      count: formatted.length,
      activities: formatted,
    });
  } catch (err) {
    console.error("GET USER ACTIVITY TIMELINE ERROR:", err);
  }
};
