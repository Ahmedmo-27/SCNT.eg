const serverless = require("serverless-http");
const app = require("../server/src/app");

const run = serverless(app);

function normalizeSegments(queryPath) {
  if (queryPath == null || queryPath === "") return [];
  return Array.isArray(queryPath) ? queryPath : [queryPath];
}

module.exports = (req, res) => {
  const raw = req.url || "";
  const q = raw.indexOf("?");
  const search = q >= 0 ? raw.slice(q) : "";
  let segments = normalizeSegments(req.query?.path);
  if (!segments.length) {
    const pathOnly = q >= 0 ? raw.slice(0, q) : raw;
    const m = pathOnly.match(/^\/api(?:\/(.+))?$/);
    if (m && m[1]) segments = m[1].split("/").filter(Boolean);
  }
  const mid = segments.length ? segments.join("/") : "";
  req.url = "/api" + (mid ? `/${mid}` : "") + search;
  return run(req, res);
};
