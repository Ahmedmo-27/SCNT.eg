const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const env = require("./config/env");
const routes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const { buildRobotsTxt, buildSitemapXml, safeBaseUrl } = require("./utils/seoDocuments");

const app = express();

function resolveSiteUrl(req) {
  const configured = safeBaseUrl(env.siteBaseUrl);
  if (configured) return configured;
  return `${req.protocol}://${req.get("host")}`.toLowerCase();
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/robots.txt", (req, res) => {
  const siteUrl = resolveSiteUrl(req);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(200).send(buildRobotsTxt(siteUrl));
});

app.get("/sitemap.xml", async (req, res, next) => {
  try {
    const siteUrl = resolveSiteUrl(req);
    const sitemap = await buildSitemapXml(siteUrl);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).send(sitemap);
  } catch (error) {
    next(error);
  }
});

app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  if (req.path.startsWith("/api") || req.path.includes(".")) return next();

  const clientDist = path.resolve(__dirname, "../../client/dist");
  const relativePath = req.path === "/" ? "index.html" : path.join(req.path.slice(1), "index.html");
  const prerenderedFile = path.join(clientDist, "prerender", relativePath);

  if (!fs.existsSync(prerenderedFile)) return next();

  res.setHeader("Cache-Control", "public, max-age=3600");
  return res.sendFile(prerenderedFile);
});

/** No DB — use this to verify the function is reachable when Atlas/network/env fails. */
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "SCNT.eg API is running" });
});

app.use("/api", routes);

// Serve the built client in production (e.g. Heroku)
if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
