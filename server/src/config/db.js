const mongoose = require("mongoose");
const env = require("./env");

let cached = globalThis.__mongooseConn;
if (!cached) {
  cached = globalThis.__mongooseConn = { conn: null, promise: null };
}

const connectDb = async () => {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(env.mongoUri, {
        autoIndex: env.nodeEnv !== "production",
      })
      .then(() => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDb;
