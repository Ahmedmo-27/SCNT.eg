const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDb = require("./config/db");
const routes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

/** No DB — use this to verify the function is reachable when Atlas/network/env fails. */
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "SCNT.eg API is running" });
});

if (process.env.VERCEL) {
  app.use(async (req, _res, next) => {
    if (req.path === "/api/health") return next();
    try {
      await connectDb();
      next();
    } catch (err) {
      next(err);
    }
  });
}

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
