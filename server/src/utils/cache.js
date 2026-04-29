let client = null;
let isConnected = false;

/**
 * Initialize in-memory cache (no Redis dependency)
 */
const initializeCache = async () => {
  client = createInMemoryCache();
  isConnected = true;
  console.log("Using in-memory cache (Redis removed)");
  return true;
};

/**
 * In-memory cache implementation (fallback)
 */
const createInMemoryCache = () => {
  const store = new Map();
  const timers = new Map();

  return {
    get: async (key) => {
      const value = store.get(key);
      return value ? JSON.parse(value) : null;
    },
    setEx: async (key, ttl, value) => {
      if (timers.has(key)) {
        clearTimeout(timers.get(key));
      }
      store.set(key, JSON.stringify(value));
      if (ttl) {
        const timer = setTimeout(() => {
          store.delete(key);
          timers.delete(key);
        }, ttl * 1000);
        timers.set(key, timer);
      }
    },
    set: async (key, value, ttl) => {
      if (timers.has(key)) {
        clearTimeout(timers.get(key));
      }
      store.set(key, JSON.stringify(value));
      if (ttl) {
        const timer = setTimeout(() => {
          store.delete(key);
          timers.delete(key);
        }, ttl * 1000);
        timers.set(key, timer);
      }
    },
    del: async (key) => {
      if (timers.has(key)) {
        clearTimeout(timers.get(key));
        timers.delete(key);
      }
      return store.delete(key) ? 1 : 0;
    },
    keys: async (pattern) => {
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      return Array.from(store.keys()).filter((key) => regex.test(key));
    },
    flushAll: async () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      store.clear();
      timers.clear();
    },
  };
};

/**
 * Generate cache key from endpoint and parameters
 */
const generateCacheKey = (prefix, params = {}) => {
  const keys = Object.keys(params)
    .sort()
    .map((k) => `${k}=${JSON.stringify(params[k])}`)
    .join("|");
  return keys ? `${prefix}:${keys}` : prefix;
};

/**
 * Get value from cache
 */
const getCache = async (key) => {
  try {
    if (!isConnected || !client) return null;
    if (typeof client.get === "function") return await client.get(key);
    return null;
  } catch (error) {
    console.error("Cache GET error:", error);
    return null;
  }
};

/**
 * Set value in cache with TTL
 */
const setCache = async (key, value, ttl = 3600) => {
  try {
    if (!isConnected || !client) return false;
    if (typeof client.setEx === "function") {
      await client.setEx(key, ttl, value);
      return true;
    }
    if (typeof client.set === "function") {
      await client.set(key, value, ttl);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Cache SET error:", error);
    return false;
  }
};

/**
 * Delete specific key from cache
 */
const deleteCache = async (key) => {
  try {
    if (!isConnected || !client) return false;
    if (typeof client.del === "function") {
      await client.del(key);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Cache DELETE error:", error);
    return false;
  }
};

/**
 * Delete multiple keys matching a pattern
 */
const invalidatePattern = async (pattern) => {
  try {
    if (!isConnected || !client) return 0;
    if (typeof client.keys === "function") {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        for (const k of keys) {
          await client.del(k);
        }
      }
      return keys.length;
    }
    return 0;
  } catch (error) {
    console.error("Cache INVALIDATE error:", error);
    return 0;
  }
};

/**
 * Clear all cache
 */
const flushCache = async () => {
  try {
    if (!isConnected || !client) return false;
    if (typeof client.flushAll === "function") {
      await client.flushAll();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Cache FLUSH error:", error);
    return false;
  }
};

/**
 * Check if cache is connected/healthy
 */
const isCacheHealthy = () => isConnected && !!client;

module.exports = {
  initializeCache,
  getCache,
  setCache,
  deleteCache,
  invalidatePattern,
  flushCache,
  generateCacheKey,
  isCacheHealthy,
};
