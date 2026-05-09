/**
 * Logs Controller
 * Handles CRUD operations for learning logs
 */

const { collections } = require("../config/firebase");
const { APIError } = require("../middleware/errorHandler");

/**
 * Get all logs for authenticated user
 * GET /api/logs
 */
const getLogs = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Get logs for user (simple query - no ordering to avoid index requirement)
    const logsRef = collections
      .logs()
      .where("uid", "==", userId)
      .limit(limitNum);

    const snapshot = await logsRef.get();

    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get total count for pagination
    const countSnapshot = await collections
      .logs()
      .where("uid", "==", userId)
      .count()
      .get();

    const total = countSnapshot.data().count;

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single log by ID
 * GET /api/logs/:id
 */
const getLog = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { id } = req.params;

    const logDoc = await collections.logs().doc(id).get();

    if (!logDoc.exists) {
      throw new APIError("Log not found", 404);
    }

    const log = logDoc.data();

    // Verify ownership
    if (log.uid !== userId) {
      throw new APIError("Access denied", 403);
    }

    res.status(200).json({
      success: true,
      data: {
        id: logDoc.id,
        ...log,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new learning log
 * POST /api/logs
 */
const createLog = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { date, startTime, endTime, learnedToday, tags, mood } = req.body;

    const logData = {
      uid: userId,
      date,
      startTime,
      endTime,
      learnedToday,
      tags: tags || [],
      mood: mood || "good",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create the log
    const logRef = await collections.logs().add(logData);

    // Update user's last activity times (for notification system)
    // Use set with merge to create user doc if it doesn't exist
    await collections.users().doc(userId).set(
      {
        lastStartTime: startTime,
        lastEndTime: endTime,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    res.status(201).json({
      success: true,
      message: "Log created successfully",
      data: {
        id: logRef.id,
        ...logData,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing log
 * PUT /api/logs/:id
 */
const updateLog = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { id } = req.params;
    const updates = req.body;

    const logRef = collections.logs().doc(id);
    const logDoc = await logRef.get();

    if (!logDoc.exists) {
      throw new APIError("Log not found", 404);
    }

    const log = logDoc.data();

    // Verify ownership
    if (log.uid !== userId) {
      throw new APIError("Access denied", 403);
    }

    // Update the log
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await logRef.update(updateData);

    // If times were updated, update user's last activity
    if (updates.startTime || updates.endTime) {
      const userUpdate = {
        updatedAt: new Date().toISOString(),
      };
      if (updates.startTime) userUpdate.lastStartTime = updates.startTime;
      if (updates.endTime) userUpdate.lastEndTime = updates.endTime;

      await collections.users().doc(userId).set(userUpdate, { merge: true });
    }

    const updatedDoc = await logRef.get();

    res.status(200).json({
      success: true,
      message: "Log updated successfully",
      data: {
        id: logRef.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a log
 * DELETE /api/logs/:id
 */
const deleteLog = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { id } = req.params;

    const logRef = collections.logs().doc(id);
    const logDoc = await logRef.get();

    if (!logDoc.exists) {
      throw new APIError("Log not found", 404);
    }

    const log = logDoc.data();

    // Verify ownership
    if (log.uid !== userId) {
      throw new APIError("Access denied", 403);
    }

    await logRef.delete();

    res.status(200).json({
      success: true,
      message: "Log deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get logs summary/statistics
 * GET /api/logs/stats
 */
const getStats = async (req, res, next) => {
  try {
    const { userId } = req.auth;

    // Get all logs for user
    const logsSnapshot = await collections
      .logs()
      .where("uid", "==", userId)
      .get();

    const logs = logsSnapshot.docs.map((doc) => doc.data());

    // Calculate statistics
    const totalLogs = logs.length;

    // Get unique dates to calculate streak
    // Ensure we only look at the YYYY-MM-DD part, ignoring time/timezone variances
    const dates = logs
      .map((log) => {
        if (!log.date) return null;
        // Handle Firestore timestamp, Date object, or string
        let dateStr;
        if (log.date._seconds) {
          dateStr = new Date(log.date._seconds * 1000)
            .toISOString()
            .split("T")[0];
        } else if (log.date instanceof Date) {
          // Use local date to avoid UTC shifts if possible, or consistent ISO
          // Better to use a consistent extractor. Since earlier we switched to local for current checks,
          // let's try to stick to the raw string if it's already YYYY-MM-DD,
          // otherwise normalize.
          dateStr = log.date.toISOString().split("T")[0];
        } else {
          // Assume string, take first 10 chars (YYYY-MM-DD)
          dateStr = String(log.date).split("T")[0];
        }
        return dateStr;
      })
      .filter(Boolean)
      .sort();

    const uniqueDates = [...new Set(dates)];

    // Calculate current streak
    let streak = 0;

    // Use local date format to match how dates are stored (YYYY-MM-DD)
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // Sort dates in descending order (newest first)
    const sortedDates = [...uniqueDates].sort().reverse();

    // Streak calculation debug logs removed for production cleanliness

    // Check if we have an entry for today or yesterday
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(
      yesterdayDate.getMonth() + 1
    ).padStart(2, "0")}-${String(yesterdayDate.getDate()).padStart(2, "0")}`;

    // Check if we have an entry for today or yesterday

    // Start counting from today or yesterday
    let checkDate = new Date(now);

    // Helper to get local date string
    const getLocalDateStr = (date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")}`;
    };

    // If no entry today, check if there's one yesterday to continue the streak
    if (!sortedDates.includes(todayStr)) {
      if (sortedDates.includes(yesterdayStr)) {
        // Start from yesterday
        checkDate = new Date(yesterdayDate);
      } else {
        // No recent entries, streak is 0
        streak = 0;
        // No recent entries, streak is 0
        streak = 0;
      }
    }

    // Count consecutive days
    const startDateStr = getLocalDateStr(checkDate);
    if (sortedDates.includes(startDateStr)) {
      while (true) {
        const checkStr = getLocalDateStr(checkDate);
        if (sortedDates.includes(checkStr)) {
          streak++;
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          // Break found
          break;
        }
      }
    }

    // Final streak calculated

    // Count tags
    const tagCounts = {};
    logs.forEach((log) => {
      (log.tags || []).forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Top tags
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    // Calculate current week vs previous week for growth
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const currentWeekLogs = logs.filter((log) => {
      const logDate = log.date._seconds
        ? new Date(log.date._seconds * 1000)
        : new Date(log.date);
      return logDate >= oneWeekAgo;
    }).length;

    const previousWeekLogs = logs.filter((log) => {
      const logDate = log.date._seconds
        ? new Date(log.date._seconds * 1000)
        : new Date(log.date);
      return logDate >= twoWeeksAgo && logDate < oneWeekAgo;
    }).length;

    let weeklyGrowth = 0;
    // If streak is broken (0), force growth to 0 to avoid confusion (e.g. +400% on a 0 streak)
    if (streak === 0) {
      weeklyGrowth = 0;
    } else if (previousWeekLogs === 0) {
      weeklyGrowth = currentWeekLogs > 0 ? 100 : 0;
    } else {
      weeklyGrowth = Math.round(
        ((currentWeekLogs - previousWeekLogs) / previousWeekLogs) * 100
      );
    }

    res.status(200).json({
      success: true,
      data: {
        totalLogs,
        currentStreak: streak,
        uniqueDays: uniqueDates.length,
        topTags,
        lastLogDate: uniqueDates[uniqueDates.length - 1] || null,
        weeklyGrowth,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLogs,
  getLog,
  createLog,
  updateLog,
  deleteLog,
  getStats,
};
