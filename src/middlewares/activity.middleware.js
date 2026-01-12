import { logActivity } from "../utils/activityTracker.js";



export const activityTracker = (defaultConfig = {}) => {
  return async (req, res, next) => {
    // Ensure container exists
    res.locals.activity = res.locals.activity || {};
    // After response is sent, write the activity if provided
    res.on("finish", async () => {
      try {
        // Only log for successful 2xx responses
        if (res.statusCode < 200 || res.statusCode >= 300) return;
        const payload = { ...defaultConfig, ...res.locals.activity };
        if (!payload || !payload.action) return; // nothing to log
        // Support batch changes or single entry
        const entries = Array.isArray(payload.changes) && payload.changes.length
          ? payload.changes.map((c) => ({ ...payload, ...c }))
          : [payload];
        for (const entry of entries) {
          await logActivity({
            userId: req.user?.id,
            userName: req.user?.name,
            userRole: req.user?.role,
            action: entry.action,
            entityType: entry.entityType,
            entityId: entry.entityId,
            entityName: entry.entityName,
            fieldName: entry.fieldName ?? null,
            oldValue: entry.oldValue ?? null,
            newValue: entry.newValue ?? null,
            description: entry.description ?? null,
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            targetUserId: entry.targetUserId ?? entry.entityId ?? null,
          });
        }
      } catch (err) {
        console.warn("activityTracker middleware failed:", err);
      }
    });

    return next();
  };
};
