const { invalidatePattern, deleteCache } = require("../utils/cache");

/**
 * Middleware to invalidate cache on write operations
 * Apply this before POST, PUT, DELETE routes
 */
const invalidateCacheOnWrite = (patterns = []) => {
  return async (req, res, next) => {
    // Store the invalidation patterns to be executed after response
    res.locals.invalidatePatterns = patterns;
    next();
  };
};

/**
 * Middleware to execute cache invalidation after response
 */
const executeCacheInvalidation = async (req, res, next) => {
  // Wrap the json method to invalidate cache after response
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    // Only invalidate if the request was successful
    if (res.statusCode < 400 && res.locals.invalidatePatterns) {
      // Execute invalidations after sending response
      setImmediate(() => {
        res.locals.invalidatePatterns.forEach(async (pattern) => {
          if (pattern.startsWith("PATTERN:")) {
            await invalidatePattern(pattern.replace("PATTERN:", ""));
          } else {
            await deleteCache(pattern);
          }
        });
      });
    }
    return originalJson(data);
  };

  next();
};

/**
 * Create a route-specific cache invalidation middleware
 * Usage: invalidateCacheFor(['products:*', 'collections:*'])
 */
const invalidateCacheFor = (patterns = []) => {
  return async (req, res, next) => {
    res.locals.invalidatePatterns = patterns.map((p) =>
      p.includes("*") ? `PATTERN:${p}` : p
    );
    next();
  };
};

module.exports = {
  invalidateCacheOnWrite,
  executeCacheInvalidation,
  invalidateCacheFor,
};
