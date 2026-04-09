const env = require("./config/env");
const connectDb = require("./config/db");
const app = require("./app");

const bootstrap = async () => {
  await connectDb();
  app.listen(env.port, () => {
    console.log(`SCNT.eg API running on port ${env.port}`);
  });
};

bootstrap().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
