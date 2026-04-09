const userRepository = require("../repositories/userRepository");
const ApiError = require("../utils/ApiError");
const { verifyToken } = require("../utils/jwt");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Authorization token is required");
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    const user = await userRepository.findById(payload.userId);

    if (!user) throw new ApiError(401, "Invalid token");
    req.user = { userId: user._id.toString(), role: user.role };
    next();
  } catch (error) {
    next(error.statusCode ? error : new ApiError(401, "Invalid or expired token"));
  }
};

module.exports = authMiddleware;
