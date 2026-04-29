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

app.set("trust proxy", true);

const productionCanonicalOrigin = "https://www.scnt-eg.me";
const configuredSiteOrigin = safeBaseUrl(env.siteBaseUrl);
const canonicalOrigin = env.nodeEnv === "production" ? productionCanonicalOrigin : configuredSiteOrigin;
const canonicalHost = canonicalOrigin ? new URL(canonicalOrigin).host.toLowerCase() : "www.scnt-eg.me";
const apexHost = canonicalHost.replace(/^www\./, "");

function normalizeHost(value) {
  if (!value) return "";
  return String(value).trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}

function buildCanonicalUrl(req) {
  if (!canonicalOrigin) return "";
  return `${canonicalOrigin}${req.originalUrl}`;
}

function resolveSiteUrl(req) {
  if (canonicalOrigin) return canonicalOrigin;

  const host = normalizeHost(req.get("host"));
  if (!host) return "";

  const protocol = req.secure ? "https" : "http";
  return `${protocol}://${host}`;
}

// Redirect the bare apex domain to the canonical www host.
// Keep the target fixed so the same request cannot bounce between protocol variants.
app.use((req, res, next) => {
  const host = normalizeHost(req.get("host"));

  if (!host) {
    return next();
  }

  if (host === apexHost) {
    const target = buildCanonicalUrl(req);
    if (target) {
      return res.redirect(301, target);
    }
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
  const oneYear = 31536000;
  const oneHour = 3600;

  app.use(
    express.static(clientDist, {
      setHeaders: (res, filePath) => {
        try {
          const name = path.basename(filePath);
          // index.html should not be cached long-term
          if (name === 'index.html') {
            res.setHeader('Cache-Control', 'no-cache');
            return;
          }

          // Hashed filenames (common pattern: name.<hash>.ext) can be cached long-term
          if (/\.[a-f0-9]{8,}\./i.test(name)) {
            res.setHeader('Cache-Control', `public, max-age=${oneYear}, immutable`);
            return;
          }

          // Common static extensions — give them a long cache but not immutable
          const ext = path.extname(name).toLowerCase();
          const longCacheExt = new Set(['.js', '.css', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.woff2', '.woff', '.ttf', '.eot']);
          if (longCacheExt.has(ext)) {
            res.setHeader('Cache-Control', `public, max-age=${oneYear}`);
            return;
          }

          // Default: short cache
          res.setHeader('Cache-Control', `public, max-age=${oneHour}`);
        } catch (err) {
          // On error, don't block serving the file
        }
      },
    })
  );

  app.get("*", (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
