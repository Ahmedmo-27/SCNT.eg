const path = require("path");
const express = require("express");
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

// Redirect non-www requests to the canonical www host to avoid duplicate canonical URLs
app.use((req, res, next) => {
  try {
    const configured = safeBaseUrl(env.siteBaseUrl);
    if (configured) {
      const configuredHost = new URL(configured).host;
      if (req.get('host') && req.get('host').toLowerCase() !== configuredHost.toLowerCase()) {
        const target = `${req.protocol}://${configuredHost}${req.originalUrl}`;
        return res.redirect(301, target);
      }
    } else {
      const host = req.get('host') || '';
      if (host && !host.toLowerCase().startsWith('www.')) {
        const target = `${req.protocol}://www.${host}${req.originalUrl}`;
        return res.redirect(301, target);
      }
    }
  } catch (err) {
    // If something goes wrong, continue without redirecting
    return next();
  }
  return next();
});

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
