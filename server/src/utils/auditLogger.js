const logger = require("./logger");
const { getClientIp } = require("../middleware/requestLogger");

/**
 * Record an administrative audit action
 * @param {import('express').Request} req - Current express request
 * @param {object} auditData
 * @param {string} auditData.action - e.g. 'PRODUCT_CREATE', 'ORDER_STATUS_UPDATE', 'PROMO_DELETE'
 * @param {string} auditData.targetType - e.g. 'Product', 'Order', 'User', 'Collection', 'PromoCode'
 * @param {string} [auditData.targetId] - ID of modified entity
 * @param {object} [auditData.details] - Description or changed fields
 */
async function recordAuditAction(req, { action, targetType, targetId = null, details = null }) {
  try {
    const adminUserId = req?.user?.userId || "unauthenticated";
    const ip = req ? getClientIp(req) : null;
    const reqId = req?.id || null;
    const method = req?.method || null;
    const url = req?.originalUrl || req?.url || null;

    const message = `[AUDIT] ${action} on ${targetType}${targetId ? ` (${targetId})` : ""} by admin ${adminUserId}`;

    logger.audit(message, {
      context: "audit",
      reqId,
      method,
      url,
      ip,
      userId: req?.user?.userId || null,
      metadata: {
        action,
        targetType,
        targetId,
        details,
        adminUserId,
      },
    });
  } catch (err) {
    logger.error(`Failed to record audit action: ${err.message}`, { context: "audit" });
  }
}

module.exports = {
  recordAuditAction,
};
