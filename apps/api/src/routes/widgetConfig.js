import express from "express";
import {
  getWidgetConfig,
  upsertWidgetConfig,
} from "../storage/widgetConfigStore.js";
import { configLimiter } from "../middleware/rateLimiter.js";
import { validateWidgetConfig } from "../middleware/validation.js";

const router = express.Router();

// Domain to Project ID mapping - can be stored in database or config
// This allows the same widget script to work on multiple websites
const DOMAIN_TO_PROJECT_MAP = {
  // Example mappings - can be expanded or moved to database
  // Format: "domain.com": "projectId"
  // "lodha.com": "5796",
  // "nivasa.com": "5797",
  // Add more mappings as needed
};

// Helper function to normalize domain
function normalizeDomain(domain) {
  if (!domain) return null;
  // Remove protocol, www, and trailing slashes
  return domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .toLowerCase()
    .trim();
}

// Get project ID from domain
router.get("/domain/:domain", async (req, res) => {
  try {
    const { domain } = req.params;
    const normalizedDomain = normalizeDomain(domain);
    
    if (!normalizedDomain) {
      return res.status(400).json({ message: "Invalid domain" });
    }
    
    // Check static mapping first
    let projectId = DOMAIN_TO_PROJECT_MAP[normalizedDomain];
    let source = 'static_map';
    
    // If not in static map, try to find by domain in database
    if (!projectId) {
      try {
        const { WidgetConfig } = await import("../models/WidgetConfig.js");
        const { config } = await import("../config.js");
        
        if (config.dataStore === "mongo") {
          // Search for config where domain is in domains array
          const configDoc = await WidgetConfig.findOne({
            domains: { $in: [normalizedDomain] }
          }).lean();
          
          if (configDoc) {
            projectId = configDoc.projectId;
            source = 'database';
            console.log(`Widget Config API: Found project ${projectId} for domain ${normalizedDomain} in database`);
          }
        }
      } catch (dbError) {
        console.warn("Widget Config API: Database lookup failed, using fallback:", dbError.message);
      }
    }
    
    // Fallback: use domain as projectId (auto-detection)
    if (!projectId) {
      projectId = normalizedDomain;
      source = 'auto_detected';
      console.log(`Widget Config API: Using domain as projectId (auto-detected): ${projectId}`);
    }
    
    res.json({ 
      projectId,
      domain: normalizedDomain,
      source
    });
  } catch (error) {
    console.error("Failed to get project ID from domain", error);
    res.status(500).json({ message: "Failed to get project ID from domain" });
  }
});

router.get("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const config = await getWidgetConfig(projectId);

    // If no config found, return default config instead of error
    if (!config || Object.keys(config).length === 0) {
      return res.json({
        projectId,
        primaryColor: "#6158ff",
        welcomeMessage: "Hi, I'm Riya from Homesfy 👋\nHow can I help you today?",
        autoOpenDelayMs: 4000,
        propertyInfo: {},
      });
    }

    res.json(config);
  } catch (error) {
    console.error("Failed to fetch widget config", error);
    // Return default config instead of 500 error
    res.json({
      projectId: req.params.projectId,
      primaryColor: "#6158ff",
      welcomeMessage: "Hi, I'm Riya from Homesfy 👋\nHow can I help you today?",
      autoOpenDelayMs: 4000,
      propertyInfo: {},
    });
  }
});

router.post("/:projectId", configLimiter, validateWidgetConfig, async (req, res) => {
  try {
    const { projectId } = req.params;
    const update = req.body;

    const config = await upsertWidgetConfig(projectId, update);

    res.json(config);
  } catch (error) {
    console.error("Failed to update widget config", error);
    res.status(500).json({ message: "Failed to update widget config" });
  }
});

export default router;


