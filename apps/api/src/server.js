import cors from "cors";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import helmet from "helmet";
import { Server as SocketIOServer } from "socket.io";
import { config } from "./config.js";
import leadsRouter from "./routes/leads.js";
import widgetConfigRouter from "./routes/widgetConfig.js";
import eventsRouter from "./routes/events.js";
import chatSessionsRouter from "./routes/chatSessions.js";
import chatRouter from "./routes/chat.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";

function expandAllowedOrigins(origins) {
  const expanded = new Set(origins);

  origins.forEach((origin) => {
    try {
      const url = new URL(origin);

      if (!url.protocol || !url.hostname) {
        return;
      }

      const portSegment = url.port ? `:${url.port}` : "";

      if (url.hostname === "localhost") {
        expanded.add(`${url.protocol}//127.0.0.1${portSegment}`);
      }

      if (url.hostname === "127.0.0.1") {
        expanded.add(`${url.protocol}//localhost${portSegment}`);
      }
    } catch {
      // Ignore entries that are not valid URLs (e.g. "null")
    }
  });

  return Array.from(expanded);
}

async function bootstrap() {
  if (config.dataStore === "mongo") {
    try {
      await mongoose.connect(config.mongoUri, {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      });
      console.log("✅ Connected to MongoDB successfully");
    } catch (error) {
      console.error("❌ MongoDB connection error:", error.message);
      if (process.env.VERCEL) {
        // On Vercel, fail fast if MongoDB is required
        throw new Error("MongoDB connection failed. MONGO_URI is required on Vercel.");
      } else {
        console.warn("⚠️  Falling back to file datastore for local development.");
      }
    }
  } else {
    console.log("Using local JSON datastore. Mongo connection skipped.");
  }

  const app = express();
  const expandedOrigins = config.allowedOrigins.includes("*")
    ? ["*"]
    : expandAllowedOrigins(config.allowedOrigins);
  const socketOrigin = expandedOrigins.includes("*") ? "*" : expandedOrigins;

  server = http.createServer(app);
  io = new SocketIOServer(server, {
    cors: {
      origin: socketOrigin,
    },
  });

  // Security Headers - Helmet.js
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline scripts for widget
          styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for widget
          imgSrc: ["'self'", "data:", "https:"], // Allow images from any HTTPS source
          connectSrc: ["'self'", "https:"], // Allow API calls to any HTTPS endpoint
          fontSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false, // Disable for widget compatibility
    })
  );

  // Request size limits - prevent DoS attacks
  app.use(express.json({ limit: "10mb" })); // Max 10MB JSON payload
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // CORS Configuration
  const corsOptions = expandedOrigins.includes("*")
    ? {
        origin: (_origin, callback) => {
          callback(null, true);
        },
        credentials: true,
      }
    : {
        origin: expandedOrigins,
        credentials: true,
      };

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  // Global rate limiting - applies to all routes
  app.use("/api", apiLimiter);

  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  app.get("/", (_req, res) => {
    res.json({
      status: "ok",
      message:
        "Homesfy API is running. See /health for a simple check or /api/widget-config/:projectId for widget config.",
    });
  });

  app.get("/.well-known/appspecific/com.chrome.devtools.json", (_req, res) => {
    res.type("application/json").send("{}");
  });

  io.on("connection", (socket) => {
    const { microsite } = socket.handshake.query;
    if (microsite) {
      socket.join(microsite);
    }
  });

  app.get("/health", async (_req, res) => {
    const aiAvailable = process.env.GEMINI_API_KEY && 
                         process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here' && 
                         process.env.GEMINI_API_KEY.trim();
    res.json({ 
      status: "ok",
      ai: {
        available: !!aiAvailable,
        model: aiAvailable ? "gemini-2.5-flash" : null,
        mode: aiAvailable ? "full-ai" : "fallback-keyword-matching"
      }
    });
  });

  app.use("/api/leads", leadsRouter);
  app.use("/api/widget-config", widgetConfigRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/chat-sessions", chatSessionsRouter);
  app.use("/api/chat", chatRouter);

  // Global error handler - must be last
  app.use(errorHandler);

  // Check Gemini AI availability on startup
  const checkAIAvailability = async () => {
    try {
      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here' && process.env.GEMINI_API_KEY.trim()) {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        console.log("✅ Gemini AI (gemini-2.5-flash) is configured and available");
        console.log("   Chat API will use full AI capabilities with intent understanding");
      } else {
        console.warn("⚠️  GEMINI_API_KEY not set - Chat API will use fallback keyword matching");
        console.warn("   To enable full AI: Set GEMINI_API_KEY in .env (get key from https://makersuite.google.com/app/apikey)");
      }
    } catch (error) {
      console.warn("⚠️  Could not verify Gemini AI availability:", error.message);
    }
  };
  
  checkAIAvailability();

  // For Vercel serverless functions, export the app instead of starting a server
  if (process.env.VERCEL) {
    // Export app for Vercel serverless functions
    module.exports = app;
  } else {
    // For local development, start the server
    server.listen(config.port, () => {
      console.log(`API server listening on port ${config.port}`);
    });
  }
}

// Only bootstrap if not in Vercel environment (Vercel will import the app directly)
if (!process.env.VERCEL) {
  bootstrap().catch((error) => {
    console.error("Failed to start API server", error);
    process.exit(1);
  });
} else {
  // For Vercel, bootstrap and export app
  bootstrap().then(() => {
    console.log("✅ API app ready for Vercel serverless functions");
  }).catch((error) => {
    console.error("Failed to bootstrap API app", error);
    process.exit(1);
  });
}

