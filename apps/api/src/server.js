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
      // Handle wildcard patterns like "http://localhost:*"
      if (origin.includes("*")) {
        const base = origin.replace("*", "");
        // Add common development ports
        [3000, 5173, 5501, 5000, 5001, 8080, 8081].forEach(port => {
          expanded.add(`${base}${port}`);
        });
        return;
      }

      const url = new URL(origin);

      if (!url.protocol || !url.hostname) {
        return;
      }

      const portSegment = url.port ? `:${url.port}` : "";

      // Always add both localhost and 127.0.0.1 variants
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        expanded.add(`${url.protocol}//localhost${portSegment}`);
        expanded.add(`${url.protocol}//127.0.0.1${portSegment}`);
      } else {
        expanded.add(origin);
      }
    } catch {
      // If it's not a URL, check if it's a special value
      if (origin === "*") {
        expanded.add("*");
      } else {
        // Try to add as-is (might be a valid origin pattern)
        expanded.add(origin);
      }
    }
  });

  return Array.from(expanded);
}

// Create app instance (will be initialized in bootstrap)
const app = express();
let server;
let io;

// Initialize basic middleware immediately (before bootstrap)
// This ensures the app is ready even if bootstrap is still running
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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

  // Request size limits already set above (before bootstrap)

  // CORS Configuration - Always allow localhost for development
  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      // Always allow localhost and 127.0.0.1 on any port for development
      if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
        return callback(null, true);
      }
      
      // If "*" is in allowed origins, allow all
      if (expandedOrigins.includes("*")) {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (expandedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Default: reject
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Length", "Content-Type"],
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
}

// Initialize app immediately for Vercel
// Bootstrap will run asynchronously
let isBootstrapped = false;
const bootstrapPromise = bootstrap().then(() => {
  isBootstrapped = true;
  console.log("✅ API app bootstrapped successfully");
}).catch((error) => {
  console.error("❌ Failed to bootstrap API app", error);
  // In Vercel, don't exit - let requests handle the error
  if (!process.env.VERCEL) {
    process.exit(1);
  }
});

// For local development, start the HTTP server after bootstrap
if (!process.env.VERCEL) {
  bootstrapPromise.then(() => {
    server.listen(config.port, () => {
      console.log(`API server listening on port ${config.port}`);
    });
  });
}

// Export app for Vercel serverless functions (ES module syntax)
export default app;

