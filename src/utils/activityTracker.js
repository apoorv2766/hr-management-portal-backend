import Audit from "../models/audit.model.js";

export const logActivity = async (params) => {
  try {
    const {
      userId, // Who made the change
      userName,
      userRole,
      action, // CREATE, UPDATE, DELETE, STATUS_CHANGE
      entityType, // "user", "interview"
      entityId, // ID of entity being changed
      entityName, // Name/identifier of entity
      fieldName, // Which field changed
      oldValue, // Previous value
      newValue, // New value
      description, // Human readable description
      ip,
      userAgent,
      targetUserId, // For user-related actions (who was affected)
    } = params;

    await Audit.create({
      userId,
      userName,
      userRole,
      action,
      entityType,
      entityId,
      entityName,
      fieldName,
      oldValue,
      newValue,
      description,
      ip,
      userAgent,
      targetUserId,
    });
  } catch (error) {
    console.warn("Activity log write failed:", error);
  }
};


