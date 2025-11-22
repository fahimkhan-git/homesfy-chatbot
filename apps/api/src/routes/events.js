import express from "express";
import { getEventSummary, recordEvent } from "../storage/eventStore.js";
import { apiLimiter } from "../middleware/rateLimiter.js";
import { validateEvent } from "../middleware/validation.js";

const router = express.Router();

router.post("/", apiLimiter, validateEvent, async (req, res) => {
  try {
    const { type, projectId, microsite, payload } = req.body;

    // Validation already handled by validateEvent middleware
    if (!type || !projectId) {
      return res.status(400).json({ message: "type and projectId required" });
    }

    const event = await recordEvent({ type, projectId, microsite, payload });
    res.status(201).json({ message: "Event recorded", event });
  } catch (error) {
    console.error("Failed to record event", error);
    res.status(500).json({ message: "Failed to record event" });
  }
});

router.get("/", apiLimiter, async (_req, res) => {
  try {
    const summary = await getEventSummary();

    res.json(summary);
  } catch (error) {
    console.error("Failed to fetch events summary", error);
    res.status(500).json({ message: "Failed to fetch events summary" });
  }
});

export default router;


