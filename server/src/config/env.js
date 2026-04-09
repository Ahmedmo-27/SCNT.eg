const path = require("path");
const dotenv = require("dotenv");

// Load server/.env regardless of cwd (Vercel monorepo root, `node` from repo root, etc.)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
};

const requiredInAllEnvs = ["mongoUri", "jwtSecret"];

requiredInAllEnvs.forEach((key) => {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = env;
