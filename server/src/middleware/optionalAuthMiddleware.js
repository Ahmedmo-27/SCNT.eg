const { verifyToken } = require("../utils/jwt");

const optionalAuthMiddleware = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const payload = verifyToken(token);
      if (payload && payload.userId) {
        req.user = {
          userId: payload.userId,
          role: payload.role || "user",
        };
      }
    }
  } catch {
    // Ignore invalid/expired tokens for optional authentication
    req.user = null;
  }
  next();
};

module.exports = optionalAuthMiddleware;
