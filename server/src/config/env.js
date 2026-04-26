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
  smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM,
  clientBaseUrl: process.env.CLIENT_BASE_URL,
  siteBaseUrl: process.env.SITE_BASE_URL || process.env.CLIENT_BASE_URL,
  emailVerificationTokenExpiresInMinutes: Number(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRES_MINUTES || 60),
};

const requiredInAllEnvs = ["mongoUri", "jwtSecret"];

requiredInAllEnvs.forEach((key) => {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = env;
