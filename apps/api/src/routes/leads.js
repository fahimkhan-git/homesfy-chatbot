import express from "express";
import { createLead, listLeads } from "../storage/leadStore.js";
import { recordEvent } from "../storage/eventStore.js";
import { createChatSession } from "../storage/chatSessionStore.js";
import { normalizePhone } from "../utils/phoneValidation.js";
import { leadLimiter } from "../middleware/rateLimiter.js";
import { validateLead } from "../middleware/validation.js";

const router = express.Router();

const SPECIAL_BHK_MAPPINGS = new Map([
  ["duplex", { type: "Duplex", numeric: null }],
  ["justbrowsing", { type: "Just Browsing", numeric: null }],
  ["justlooking", { type: "Just Browsing", numeric: null }],
  ["other", { type: "Other", numeric: null }],
  ["yettodecide", { type: "Yet to decide", numeric: null }],
]);

function normalizeKey(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeBhkPreference({ bhk, bhkType }) {
  if (bhk !== undefined && bhk !== null && bhk !== "") {
    const numericValue = Number(bhk);

    if (Number.isFinite(numericValue)) {
      if (numericValue === 0) {
        return { type: "Yet to decide", numeric: null };
      }

      const rounded = Math.round(numericValue);
      if (rounded >= 1 && rounded <= 4) {
        return { type: `${rounded} BHK`, numeric: rounded };
      }

      return { type: "Other", numeric: rounded };
    }
  }

  if (bhkType !== undefined && bhkType !== null && bhkType !== "") {
    const trimmed = String(bhkType).trim();
    if (!trimmed) {
      return null;
    }

    const compactKey = normalizeKey(trimmed);

    if (SPECIAL_BHK_MAPPINGS.has(compactKey)) {
      return SPECIAL_BHK_MAPPINGS.get(compactKey);
    }

    const digitsMatch = trimmed.match(/(\d+)/);
    if (digitsMatch) {
      const numeric = Number(digitsMatch[1]);
      if (Number.isFinite(numeric)) {
        if (numeric === 0) {
          return { type: "Yet to decide", numeric: null };
        }
        if (numeric >= 1 && numeric <= 4) {
          return { type: `${numeric} BHK`, numeric };
        }
        return { type: "Other", numeric };
      }
    }
  }

  return null;
}

// Apply rate limiting and validation to lead submission
router.post("/", leadLimiter, validateLead, async (req, res) => {
  try {
    const { phone, bhk, bhkType, microsite, metadata, conversation } = req.body;

    // Validation already handled by validateLead middleware
    if (!microsite) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedBhk = normalizeBhkPreference({ bhk, bhkType });

    if (!normalizedBhk) {
      return res
        .status(400)
        .json({ message: "Invalid or missing BHK preference" });
    }

    const sanitizedPhone =
      typeof phone === "string" && phone.trim().length > 0
        ? phone.trim()
        : undefined;

    let normalizedPhoneResult = null;
    if (sanitizedPhone) {
      normalizedPhoneResult = normalizePhone(sanitizedPhone);
      if (normalizedPhoneResult.error) {
        return res.status(400).json({ message: normalizedPhoneResult.error });
      }
    }

    const normalizedPhone = normalizedPhoneResult?.value;
    let metadataPayload =
      metadata && typeof metadata === "object" ? { ...metadata } : undefined;

    if (normalizedPhoneResult && metadataPayload) {
      metadataPayload.phoneCountry =
        metadataPayload.phoneCountry ??
        normalizedPhoneResult.country?.name ??
        metadataPayload.phoneCountry;
      metadataPayload.phoneCountryCode =
        metadataPayload.phoneCountryCode ??
        normalizedPhoneResult.country?.countryCode ??
        metadataPayload.phoneCountryCode;
      metadataPayload.phoneDialCode =
        metadataPayload.phoneDialCode ??
        normalizedPhoneResult.country?.code ??
        metadataPayload.phoneDialCode;
      metadataPayload.phoneSubscriber =
        metadataPayload.phoneSubscriber ??
        normalizedPhoneResult.subscriber ??
        metadataPayload.phoneSubscriber;
    } else if (normalizedPhoneResult && !metadataPayload) {
      metadataPayload = {
        phoneCountry: normalizedPhoneResult.country?.name,
        phoneCountryCode: normalizedPhoneResult.country?.countryCode,
        phoneDialCode: normalizedPhoneResult.country?.code,
        phoneSubscriber: normalizedPhoneResult.subscriber,
      };
    }

    const lead = await createLead({
      phone: normalizedPhone,
      bhk: normalizedBhk.numeric,
      bhkType: normalizedBhk.type,
      microsite,
      metadata: metadataPayload,
      conversation,
    });

    try {
      await createChatSession({
        microsite,
        projectId: metadata?.projectId,
        leadId: lead.id,
        phone: normalizedPhone ?? sanitizedPhone,
        bhkType: normalizedBhk.type,
        conversation,
        metadata: metadataPayload,
      });
    } catch (error) {
      console.error("Failed to store chat session", error);
    }

    req.io?.to(microsite).emit("lead:new", lead);

    await recordEvent({
      type: "lead_submitted",
      projectId: microsite,
      microsite,
      payload: {
        bhkType: normalizedBhk.type,
        ...(normalizedBhk.numeric !== null &&
          normalizedBhk.numeric !== undefined && { bhk: normalizedBhk.numeric }),
      },
    });

    res.status(201).json({ message: "Lead created", lead });
  } catch (error) {
    console.error("Failed to create lead", error);
    res.status(500).json({ message: "Failed to create lead" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { microsite, search, startDate, endDate, limit = 50, skip = 0 } =
      req.query;
    const { items, total } = await listLeads({
      microsite,
      search,
      startDate,
      endDate,
      limit,
      skip,
    });

    res.json({ items, total });
  } catch (error) {
    console.error("Failed to list leads", error);
    res.status(500).json({ message: "Failed to list leads" });
  }
});

export default router;


