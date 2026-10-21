const http = require("node:http");
const app = require("../../src/app");

/**
 * Shared persistent in-process HTTP server and keep-alive agent
 * to eliminate per-request ephemeral server churn and TCP socket exhaustion.
 */
function getOrCreateServer() {
  if (globalThis.__testHttpPort && globalThis.__testHttpServer) {
    return Promise.resolve({
      server: globalThis.__testHttpServer,
      port: globalThis.__testHttpPort,
      agent: globalThis.__testHttpAgent,
    });
  }

  if (globalThis.__testHttpServerPromise) {
    return globalThis.__testHttpServerPromise;
  }

  globalThis.__testHttpServerPromise = new Promise((resolve, reject) => {
    const server = http.createServer(app);
    // Configure server keep-alive timeouts to prevent premature closing of idle pooled sockets
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

    const agent = new http.Agent({
      keepAlive: true,
      keepAliveMsecs: 10000,
      maxSockets: 100,
      maxFreeSockets: 50,
      timeout: 60000,
    });

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = addr.port;
      // unref() ensures the listening socket does not hold the Node process open indefinitely
      server.unref();

      globalThis.__testHttpServer = server;
      globalThis.__testHttpPort = port;
      globalThis.__testHttpAgent = agent;
      resolve({ server, port, agent });
    });

    server.on("error", (err) => {
      globalThis.__testHttpServerPromise = null;
      globalThis.__testHttpServer = null;
      globalThis.__testHttpPort = null;
      globalThis.__testHttpAgent = null;
      reject(err);
    });
  });

  return globalThis.__testHttpServerPromise;
}

/**
 * Executes an in-process HTTP request against the persistent Express server.
 */
async function request({ method, path, body = null, headers = {} }) {
  const { port, agent } = await getOrCreateServer();
  const formattedPath = path.startsWith("/") ? path : `/${path}`;

  return new Promise((resolve, reject) => {
    let settled = false;
    const safeResolve = (val) => {
      if (!settled) {
        settled = true;
        resolve(val);
      }
    };
    const safeReject = (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    };

    const reqHeaders = { ...headers };

    let payload = null;
    if (body !== null && body !== undefined) {
      payload = typeof body === "string" ? body : JSON.stringify(body);
      const hasContentType = Object.keys(reqHeaders).some(
        (k) => k.toLowerCase() === "content-type"
      );
      if (!hasContentType) {
        reqHeaders["Content-Type"] = "application/json";
      }
      reqHeaders["Content-Length"] = Buffer.byteLength(payload, "utf8");
    }

    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path: formattedPath,
        method,
        headers: reqHeaders,
        agent,
      },
      (res) => {
        let text = "";
        res.setEncoding("utf8");

        res.on("data", (chunk) => {
          text += chunk;
        });

        res.on("end", () => {
          let parsedBody = null;
          if (text && text.trim().length > 0) {
            try {
              parsedBody = JSON.parse(text);
            } catch (_) {
              parsedBody = text;
            }
          }
          safeResolve({
            status: res.statusCode,
            statusCode: res.statusCode,
            body: parsedBody,
            text,
            headers: res.headers,
          });
        });

        res.on("error", (err) => {
          safeReject(err);
        });
      }
    );

    // 45s timeout for database queries over remote Atlas SSL
    req.setTimeout(45000, () => {
      req.destroy(new Error(`Request to ${method} ${formattedPath} timed out after 45000ms`));
    });

    req.on("error", (err) => {
      safeReject(err);
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

/**
 * Clean teardown helper for manual or process-level shutdown.
 */
function closeServer(cb) {
  if (globalThis.__testHttpAgent) {
    try {
      globalThis.__testHttpAgent.destroy();
    } catch (_) {}
    globalThis.__testHttpAgent = null;
  }
  if (globalThis.__testHttpServer) {
    try {
      globalThis.__testHttpServer.close(cb);
    } catch (_) {
      if (cb) cb();
    }
    globalThis.__testHttpServer = null;
    globalThis.__testHttpPort = null;
    globalThis.__testHttpServerPromise = null;
  } else if (cb) {
    cb();
  }
}

const get = (path, headers) => request({ method: "GET", path, headers });
const post = (path, body, headers) => request({ method: "POST", path, body, headers });
const put = (path, body, headers) => request({ method: "PUT", path, body, headers });
const patch = (path, body, headers) => request({ method: "PATCH", path, body, headers });
const del = (path, headers) => request({ method: "DELETE", path, headers });

module.exports = {
  request,
  get,
  post,
  put,
  patch,
  delete: del,
  del,
  closeServer,
  teardown: closeServer,
};
