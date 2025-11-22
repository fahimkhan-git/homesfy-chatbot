import rateLimit from "express-rate-limit";

// General API rate limiter - 100 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for chat endpoint - 30 requests per minute per IP
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  message: {
    error: "Too many chat requests, please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Lead submission rate limiter - 10 requests per hour per IP
export const leadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 lead submissions per hour
  message: {
    error: "Too many lead submissions, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Config update rate limiter - 20 requests per hour per IP
export const configLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 config updates per hour
  message: {
    error: "Too many configuration updates, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

