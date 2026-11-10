// src/utils/notify.js
const Notification = require("../models/Notification");

/**
 * Fire a notification. Never throws — swallows errors so a notification
 * failure can't break a business operation (send quote, receive payment, etc.)
 */
async function notify({ organization, user, type, title, message, link }) {
  try {
    if (!organization || !user || !type || !title) return null;
    return await Notification.create({
      organization,
      user,
      type,
      title,
      message: message || null,
      link: link || null,
    });
  } catch (err) {
    console.error("[notify] failed:", err.message);
    return null;
  }
}

/**
 * Fire the same notification to multiple users.
 */
async function notifyMany(userIds, payload) {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];
  const results = [];
  for (const uid of userIds) {
    results.push(await notify({ ...payload, user: uid }));
  }
  return results;
}

module.exports = { notify, notifyMany };