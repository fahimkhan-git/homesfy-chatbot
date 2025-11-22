import dotenv from "dotenv";

dotenv.config();

const normalizedPort =
  process.env.API_PORT && process.env.API_PORT.trim()
    ? Number(process.env.API_PORT.trim())
    : 4000;

const isVercel = Boolean(process.env.VERCEL);

const resolvedDataStore = (() => {
  const raw = process.env.DATA_STORE && process.env.DATA_STORE.trim();
  if (raw) {
    return raw.toLowerCase();
  }
  // Default to Mongo when running on Vercel so we don't attempt to write to the
  // read-only filesystem that powers serverless functions.
  return isVercel ? "mongo" : "file";
})();

if (resolvedDataStore === "mongo" && !process.env.MONGO_URI) {
  const message =
    "MONGO_URI environment variable is required when DATA_STORE=mongo. " +
    "Set it to a MongoDB connection string (e.g. from MongoDB Atlas).";
  if (isVercel) {
    throw new Error(message);
  } else {
    console.warn(message + " Falling back to file store for local development.");
  }
}

export const config = {
  port: Number.isFinite(normalizedPort) ? normalizedPort : 4000,
  mongoUri:
    (process.env.MONGO_URI && process.env.MONGO_URI.trim()) ||
    "mongodb://localhost:27017/homesfy_chat",
  allowedOrigins: (() => {
    const raw = process.env.ALLOWED_ORIGINS;
    if (raw && raw.trim()) {
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
    // Default: Allow all origins (includes localhost for development)
    return ["*"];
  })(),
  dataStore: resolvedDataStore,
};


