export const formatDateTime = (date) => {
  return new Date(date).toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const sanitizeValue = (val) => {
  if (val === null || val === undefined || val === "undefined") return "N/A";
  const str = String(val).trim();
  return str || "N/A";
};

const formatFieldValue = (fieldName, val) => {
  const sanitized = sanitizeValue(val);
  if (sanitized === "N/A") return sanitized;

  // Format date fields
  if (fieldName === "joiningDate") {
    // Check if it's a timestamp or date string
    const isTimestamp = /^\d+$/.test(sanitized);
    const d = isTimestamp ? new Date(parseInt(sanitized)) : new Date(sanitized);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    }
    return sanitized;
  }

  if (fieldName === "interviewDateTime") {
    // Check if it's a timestamp or date string
    const isTimestamp = /^\d+$/.test(sanitized);
    const d = isTimestamp ? new Date(parseInt(sanitized)) : new Date(sanitized);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
    return sanitized;
  }

  return sanitized;
};

export const formatActivityEntry = (activity) => {
  const actor = activity.userName || "Unknown";
  const role = activity.userRole ? ` (${activity.userRole})` : "";
  let targetName = activity.entityName || "user";
  
  // For interview activities, extract only the candidate name (remove job title)
  if (activity.action?.includes("INTERVIEW") || activity.action === "ASSIGN_INTERVIEWER") {
    const parts = targetName.split(" - ");
    if (parts.length > 1) {
      targetName = parts[0]; // Keep only the candidate name
    }
  }
  
  const when = formatDateTime(activity.createdAt);

  if (activity.action === "CREATE_USER") {
    return `${actor}${role} has created ${targetName} at ${when}`;
  }
  if (activity.action === "DELETE_USER") {
    return `${actor}${role} has deleted ${targetName} at ${when}`;
  }
  if (activity.action === "UPDATE_USER") {
    if (activity.fieldName) {
      const formatValue = (val) => {
        const sanitized = sanitizeValue(val);
        if (sanitized === "N/A") return sanitized;
        return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
      };
      const oldVal = formatValue(activity.oldValue);
      const newVal = formatValue(activity.newValue);
      console.log("newValnewVal",newVal);
      
      return `${actor}${role} updated ${targetName}'s ${activity.fieldName} from ${oldVal} to ${newVal} at ${when}`;
    }
    return `${actor}${role} updated ${targetName} at ${when}`;
  }
  if (activity.action === "CREATE_INTERVIEW") {
    const desc = sanitizeValue(activity.description);
    return `${actor}${role} created ${targetName} at ${when}`;
  }
  if (activity.action === "DELETE_INTERVIEW") {
    return `${actor}${role} deleted ${targetName} at ${when}`;
  }
  if (activity.action === "ASSIGN_INTERVIEWER") {
    const desc = sanitizeValue(activity.description);
    return `${actor}${role} ${desc} at ${when}`;
  }
  if (activity.action === "UPDATE_INTERVIEW") {
    if (activity.fieldName) {
      const oldVal = formatFieldValue(activity.fieldName, activity.oldValue);
      const newVal = formatFieldValue(activity.fieldName, activity.newValue);

      // Special handling for first-time assignment (oldVal is N/A)
      if (oldVal === "N/A") {
        if (activity.fieldName === "assignedInterviewer") {
          return `${actor}${role} assigned ${newVal} as interviewer at ${when}`;
        }
        // Generic first-time assignment for other fields
        return `${actor}${role} set ${activity.fieldName} to ${newVal} at ${when}`;
      }

      return `${actor}${role} changed ${activity.fieldName} from ${oldVal} to ${newVal} at ${when}`;
    }
    return `${actor}${role} updated ${targetName} at ${when}`;
  }
  if (activity.description) {
    const desc = sanitizeValue(activity.description);
    return `${actor}${role} ${desc} at ${when}`;
  }
  return `${actor}${role} performed ${
    activity.action || "an action"
  } on ${targetName} at ${when}`;
};
