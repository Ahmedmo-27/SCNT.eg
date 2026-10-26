const env = require("./config/env");
const connectDb = require("./config/db");
const { initializeCache } = require("./utils/cache");
const logger = require("./utils/logger");
const app = require("./app");

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception: " + error.message, {
    context: "process",
    stack: error.stack,
  });
});

process.on("unhandledRejection", (reason) => {
  logger.error(
    "Unhandled Rejection: " + (reason instanceof Error ? reason.message : String(reason)),
    {
      context: "process",
      stack: reason instanceof Error ? reason.stack : null,
    }
  );
});

const bootstrap = async () => {
  await connectDb();
  await initializeCache();
  app.listen(env.port, '0.0.0.0', () => {
    logger.info(`SCNT.eg API running on port ${env.port} [env=${env.nodeEnv}]`, {
      context: "server",
    });
  });
};

bootstrap().catch((error) => {
  logger.error("Failed to start server: " + error.message, {
    context: "bootstrap",
    stack: error.stack,
  });
  process.exit(1);
});

