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

export const formatActivityEntry = (activity) => {
  const actor = activity.userName || "Unknown";
  const role = activity.userRole ? ` (${activity.userRole})` : "";
  const targetName = activity.entityName || "user";
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
        if (val === null || val === undefined) return "-";
        return String(val).charAt(0).toUpperCase() + String(val).slice(1);
      };
      const oldVal = formatValue(activity.oldValue);
      const newVal = formatValue(activity.newValue);
      return `${actor}${role} updated ${targetName}'s ${activity.fieldName} from ${oldVal} to ${newVal} at ${when}`;
    }
    return `${actor}${role} updated ${targetName} at ${when}`;
  }
  if (activity.description) {
    return `${actor}${role} ${activity.description} at ${when}`;
  }
  return `${actor}${role} performed ${
    activity.action || "an action"
  } on ${targetName} at ${when}`;
};
