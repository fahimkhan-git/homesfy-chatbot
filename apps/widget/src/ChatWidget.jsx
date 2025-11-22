import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";

const DEFAULT_PRIMARY_COLOR = "#6158ff";
const DEFAULT_PRIMARY_RGB = "97, 88, 255";
const DEFAULT_AVATAR_URL =
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHN2Z2FzdmY4MmFjYWZ2enl1cWx1d3ozYnkwNWJxb2l4dXUzcDZvOCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3oriO0OEd9QIDdllqo/giphy.gif";

function extractRgbChannels(color) {
  if (typeof color !== "string") {
    return null;
  }

  const trimmed = color.trim();

  if (trimmed.startsWith("#")) {
    let hex = trimmed.slice(1);
    if ([3, 4].includes(hex.length)) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("")
        .slice(0, 6);
    }

    if ((hex.length === 6 || hex.length === 8) && /^[0-9a-f]{6,8}$/i.test(hex)) {
      const base = hex.slice(0, 6);
      const r = parseInt(base.slice(0, 2), 16);
      const g = parseInt(base.slice(2, 4), 16);
      const b = parseInt(base.slice(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    }

    return null;
  }

  const rgbMatch = trimmed.match(
    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i
  );

  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map(Number);
    if ([r, g, b].every((channel) => channel >= 0 && channel <= 255)) {
      return `${r}, ${g}, ${b}`;
    }
  }

  return null;
}

function resolveAvatarUrl(raw) {
  if (raw === undefined) {
    return DEFAULT_AVATAR_URL;
  }

  if (raw === null) {
    return "";
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed;
  }

  return DEFAULT_AVATAR_URL;
}

const UTM_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
];
const CTA_OPTIONS = [
  "Pricing & Floor Plans 💸💸",
  "Download Brochure ⬇️",
  "Get The Best Quote 💰",
  "Site Visit Or Virtual Tour 🚁",
  "Pricing on Whatsapp ✅",
  "Get A Call Back 📞",
];

const BHK_OPTIONS = [
  "1 Bhk",
  "2 Bhk",
  "3 Bhk",
  "4 Bhk",
  "Other",
  "Yet to decide",
];

const COUNTRY_PHONE_CODES = [
  { code: "+91", name: "India", countryCode: "IN", selected: true },
  { code: "+1", name: "USA", countryCode: "US" },
  { code: "+44", name: "UK", countryCode: "GB" },
  { code: "+971", name: "UAE", countryCode: "AE" },
  { code: "+61", name: "Australia", countryCode: "AU" },
  { code: "+1", name: "Canada", countryCode: "CA" },
  { code: "+65", name: "Singapore", countryCode: "SG" },
  { code: "+86", name: "China", countryCode: "CN" },
  { code: "+81", name: "Japan", countryCode: "JP" },
  { code: "+49", name: "Germany", countryCode: "DE" },
  { code: "+33", name: "France", countryCode: "FR" },
  { code: "+39", name: "Italy", countryCode: "IT" },
  { code: "+34", name: "Spain", countryCode: "ES" },
  { code: "+92", name: "Pakistan", countryCode: "PK" },
  { code: "+880", name: "Bangladesh", countryCode: "BD" },
  { code: "+94", name: "Sri Lanka", countryCode: "LK" },
  { code: "+977", name: "Nepal", countryCode: "NP" },
  { code: "+60", name: "Malaysia", countryCode: "MY" },
  { code: "+66", name: "Thailand", countryCode: "TH" },
  { code: "+62", name: "Indonesia", countryCode: "ID" },
  { code: "+63", name: "Philippines", countryCode: "PH" },
  { code: "+84", name: "Vietnam", countryCode: "VN" },
  { code: "+852", name: "Hong Kong", countryCode: "HK" },
  { code: "+966", name: "Saudi Arabia", countryCode: "SA" },
  { code: "+973", name: "Bahrain", countryCode: "BH" },
  { code: "+965", name: "Kuwait", countryCode: "KW" },
  { code: "+974", name: "Qatar", countryCode: "QA" },
  { code: "+968", name: "Oman", countryCode: "OM" },
  { code: "+20", name: "Egypt", countryCode: "EG" },
  { code: "+27", name: "South Africa", countryCode: "ZA" },
  { code: "+234", name: "Nigeria", countryCode: "NG" },
  { code: "+254", name: "Kenya", countryCode: "KE" },
  { code: "+55", name: "Brazil", countryCode: "BR" },
  { code: "+52", name: "Mexico", countryCode: "MX" },
  { code: "+54", name: "Argentina", countryCode: "AR" },
  { code: "+7", name: "Russia", countryCode: "RU" },
  { code: "+380", name: "Ukraine", countryCode: "UA" },
  { code: "+48", name: "Poland", countryCode: "PL" },
  { code: "+90", name: "Turkey", countryCode: "TR" },
  { code: "+213", name: "Algeria", countryCode: "DZ" },
  { code: "+376", name: "Andorra", countryCode: "AD" },
  { code: "+244", name: "Angola", countryCode: "AO" },
  { code: "+1264", name: "Anguilla", countryCode: "AI" },
  { code: "+1268", name: "Antigua & Barbuda", countryCode: "AG" },
  { code: "+374", name: "Armenia", countryCode: "AM" },
  { code: "+297", name: "Aruba", countryCode: "AW" },
  { code: "+43", name: "Austria", countryCode: "AT" },
  { code: "+994", name: "Azerbaijan", countryCode: "AZ" },
  { code: "+1242", name: "Bahamas", countryCode: "BS" },
  { code: "+1246", name: "Barbados", countryCode: "BB" },
  { code: "+375", name: "Belarus", countryCode: "BY" },
  { code: "+32", name: "Belgium", countryCode: "BE" },
  { code: "+501", name: "Belize", countryCode: "BZ" },
  { code: "+229", name: "Benin", countryCode: "BJ" },
  { code: "+1441", name: "Bermuda", countryCode: "BM" },
  { code: "+975", name: "Bhutan", countryCode: "BT" },
  { code: "+591", name: "Bolivia", countryCode: "BO" },
  { code: "+387", name: "Bosnia Herzegovina", countryCode: "BA" },
  { code: "+267", name: "Botswana", countryCode: "BW" },
  { code: "+673", name: "Brunei", countryCode: "BN" },
  { code: "+359", name: "Bulgaria", countryCode: "BG" },
  { code: "+226", name: "Burkina Faso", countryCode: "BF" },
  { code: "+257", name: "Burundi", countryCode: "BI" },
  { code: "+855", name: "Cambodia", countryCode: "KH" },
  { code: "+237", name: "Cameroon", countryCode: "CM" },
  { code: "+238", name: "Cape Verde Islands", countryCode: "CV" },
  { code: "+1345", name: "Cayman Islands", countryCode: "KY" },
  { code: "+236", name: "Central African Republic", countryCode: "CF" },
  { code: "+56", name: "Chile", countryCode: "CL" },
  { code: "+57", name: "Colombia", countryCode: "CO" },
  { code: "+269", name: "Comoros", countryCode: "KM" },
  { code: "+242", name: "Congo", countryCode: "CG" },
  { code: "+682", name: "Cook Islands", countryCode: "CK" },
  { code: "+506", name: "Costa Rica", countryCode: "CR" },
  { code: "+385", name: "Croatia", countryCode: "HR" },
  { code: "+357", name: "Cyprus", countryCode: "CY" },
  { code: "+420", name: "Czech Republic", countryCode: "CZ" },
  { code: "+45", name: "Denmark", countryCode: "DK" },
  { code: "+253", name: "Djibouti", countryCode: "DJ" },
  { code: "+372", name: "Estonia", countryCode: "EE" },
  { code: "+251", name: "Ethiopia", countryCode: "ET" },
  { code: "+358", name: "Finland", countryCode: "FI" },
  { code: "+995", name: "Georgia", countryCode: "GE" },
  { code: "+233", name: "Ghana", countryCode: "GH" },
  { code: "+30", name: "Greece", countryCode: "GR" },
  { code: "+852", name: "Hong Kong", countryCode: "HK" },
  { code: "+36", name: "Hungary", countryCode: "HU" },
  { code: "+354", name: "Iceland", countryCode: "IS" },
  { code: "+353", name: "Ireland", countryCode: "IE" },
  { code: "+972", name: "Israel", countryCode: "IL" },
  { code: "+1876", name: "Jamaica", countryCode: "JM" },
  { code: "+962", name: "Jordan", countryCode: "JO" },
  { code: "+7", name: "Kazakhstan", countryCode: "KZ" },
  { code: "+82", name: "Korea South", countryCode: "KR" },
  { code: "+961", name: "Lebanon", countryCode: "LB" },
  { code: "+370", name: "Lithuania", countryCode: "LT" },
  { code: "+60", name: "Malaysia", countryCode: "MY" },
  { code: "+960", name: "Maldives", countryCode: "MV" },
  { code: "+356", name: "Malta", countryCode: "MT" },
  { code: "+230", name: "Mauritius", countryCode: "MU" },
  { code: "+377", name: "Monaco", countryCode: "MC" },
  { code: "+212", name: "Morocco", countryCode: "MA" },
  { code: "+31", name: "Netherlands", countryCode: "NL" },
  { code: "+64", name: "New Zealand", countryCode: "NZ" },
  { code: "+47", name: "Norway", countryCode: "NO" },
  { code: "+351", name: "Portugal", countryCode: "PT" },
  { code: "+40", name: "Romania", countryCode: "RO" },
  { code: "+221", name: "Senegal", countryCode: "SN" },
  { code: "+381", name: "Serbia", countryCode: "RS" },
  { code: "+421", name: "Slovakia", countryCode: "SK" },
  { code: "+386", name: "Slovenia", countryCode: "SI" },
  { code: "+211", name: "South Sudan", countryCode: "SS" },
  { code: "+46", name: "Sweden", countryCode: "SE" },
  { code: "+41", name: "Switzerland", countryCode: "CH" },
  { code: "+886", name: "Taiwan", countryCode: "TW" },
  { code: "+255", name: "Tanzania", countryCode: "TZ" },
  { code: "+216", name: "Tunisia", countryCode: "TN" },
  { code: "+256", name: "Uganda", countryCode: "UG" },
  { code: "+598", name: "Uruguay", countryCode: "UY" },
  { code: "+998", name: "Uzbekistan", countryCode: "UZ" },
  { code: "+58", name: "Venezuela", countryCode: "VE" },
  { code: "+260", name: "Zambia", countryCode: "ZM" },
  { code: "+263", name: "Zimbabwe", countryCode: "ZW" },
];

const DEFAULT_COUNTRY =
  COUNTRY_PHONE_CODES.find((entry) => entry.selected) ||
  COUNTRY_PHONE_CODES.find((entry) => entry.code === "+91") ||
  COUNTRY_PHONE_CODES[0];

function countryOptionKey(entry) {
  return `${entry.code}|${entry.countryCode}`;
}

function findCountryByKey(value) {
  return COUNTRY_PHONE_CODES.find(
    (entry) => countryOptionKey(entry) === value
  );
}

const SORTED_COUNTRY_PHONE_CODES = COUNTRY_PHONE_CODES.slice().sort(
  (a, b) => b.code.length - a.code.length
);

function pickCountryByDialCode(value) {
  return SORTED_COUNTRY_PHONE_CODES.find((entry) =>
    value.startsWith(entry.code)
  );
}

function normalizePhoneInput(raw) {
  if (typeof raw !== "string") {
    return { error: "Please enter a valid phone number." };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { error: "Please enter a phone number." };
  }

  const stripped = trimmed.replace(/[\s().-]/g, "");
  if (!/^\+?\d+$/.test(stripped)) {
    return { error: "Phone numbers should contain digits and an optional +." };
  }

  const digitsOnly = stripped.replace(/\D/g, "");
  const withPlus = stripped.startsWith("+") ? stripped : `+${stripped}`;
  const explicitCountry = pickCountryByDialCode(withPlus);

  let country = explicitCountry;
  let subscriberDigits =
    explicitCountry?.code !== undefined
      ? withPlus.slice(explicitCountry.code.length)
      : digitsOnly;

  if (!explicitCountry && !stripped.startsWith("+")) {
    const looksLikeIndianWithIsd =
      digitsOnly.length === 12 && digitsOnly.startsWith("91");
    const digitsWithoutIsd = looksLikeIndianWithIsd
      ? digitsOnly.slice(2)
      : digitsOnly;
    country = COUNTRY_PHONE_CODES.find((entry) => entry.code === "+91");
    subscriberDigits = digitsWithoutIsd;
  }

  if (!subscriberDigits || !/^\d+$/.test(subscriberDigits)) {
    return { error: "Please enter a valid phone number." };
  }

  if (!country) {
    return { error: "Unsupported or missing country dial code." };
  }

  if (country.code === "+91") {
    if (subscriberDigits.length !== 10) {
      return {
        error: "Indian mobile numbers must be 10 digits long.",
      };
    }
    if (!/^[6-9]/.test(subscriberDigits)) {
      return {
        error: "Indian mobile numbers must start with 6, 7, 8, or 9.",
      };
    }
  } else if (subscriberDigits.length < 4 || subscriberDigits.length > 14) {
    return {
      error: "Please enter a valid mobile number for the selected country.",
    };
  }

  return {
    value: `${country.code}${subscriberDigits}`,
    country,
    subscriber: subscriberDigits,
  };
}

function formatPhoneDisplay(result) {
  if (!result || typeof result !== "object") {
    return "";
  }

  const dialCode =
    typeof result.country?.code === "string"
      ? result.country.code.trim()
      : "";
  const subscriber =
    typeof result.subscriber === "string"
      ? result.subscriber.replace(/\s+/g, "")
      : "";

  if (!dialCode) {
    return subscriber || (typeof result.value === "string" ? result.value : "");
  }

  if (!subscriber) {
    return dialCode;
  }

  return `${dialCode} ${subscriber}`;
}

const generateId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function ChatWidget({
  apiBaseUrl,
  projectId,
  microsite,
  theme = {},
  onEvent,
}) {
  // Extract propertyInfo from theme
  const propertyInfo = theme.propertyInfo || {};
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCta, setSelectedCta] = useState(null);
  const [selectedBhk, setSelectedBhk] = useState(null);
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [userName, setUserName] = useState("");
  const [error, setError] = useState(null);
  const [visitorContext, setVisitorContext] = useState({});
  const messagesEndRef = useRef(null);
  const hasShownRef = useRef(false);
  const autoOpenTimeoutRef = useRef(null);
  const [manualInput, setManualInput] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  // Track AI-triggered input mode (chat, name, phone, leadForm)
  const [aiInputMode, setAiInputMode] = useState("chat"); // "chat" | "name" | "phone" | "leadForm"
  const [hasAiConversationStarted, setHasAiConversationStarted] = useState(false);
  // Separate state for combined lead form (name + phone together)
  const [leadFormName, setLeadFormName] = useState("");
  const [leadFormPhone, setLeadFormPhone] = useState("");
  const [isLeadFormActive, setIsLeadFormActive] = useState(false);

  const resolvedTheme = useMemo(
    () => ({
      agentName: theme.agentName || "Pooja Agarwal",
      avatarUrl: resolveAvatarUrl(theme.avatarUrl),
      primaryColor: theme.primaryColor || DEFAULT_PRIMARY_COLOR,
      bubblePosition: theme.bubblePosition || "bottom-right",
      welcomeMessage:
        theme.welcomeMessage ||
        "Hey, I'm Pooja Agarwal! How can I help you understand this project?",
      namePrompt:
        theme.namePrompt || "Please enter your name",
      ctaAcknowledgement:
        theme.followupMessage ||
        theme.ctaAcknowledgement ||
        "Sure… I’ll send that across right away!",
      bhkPrompt:
        theme.bhkPrompt || "Which configuration you are looking for?",
      inventoryMessage:
        theme.inventoryMessage ||
        "That’s cool… we have inventory available with us.",
      phonePrompt:
        theme.phonePrompt || "Please enter your mobile number...",
      thankYouMessage:
        theme.thankYouMessage ||
        "Thanks! Our expert will call you shortly 📞",
      autoOpenDelayMs: Number(theme.autoOpenDelayMs || 4000),
      bubbleTitle: theme.bubbleTitle || "Chat with us",
      bubbleSubtitle: theme.bubbleSubtitle || "Expert help in minutes",
      heroPoints:
        Array.isArray(theme.heroPoints) && theme.heroPoints.length > 0
          ? theme.heroPoints
          : [
              "Instant project availability",
              "Exclusive launch offers",
              "Dedicated closing support",
            ],
      trustBadges:
        Array.isArray(theme.trustBadges) && theme.trustBadges.length > 0
          ? theme.trustBadges
          : [
              "2000+ happy buyers assisted",
              "Verified listings • RERA compliant",
            ],
    }),
    [theme]
  );

  const ctaOptions = CTA_OPTIONS;

  const bhkOptions = BHK_OPTIONS;

  const [avatarUrl, setAvatarUrl] = useState(
    resolvedTheme.avatarUrl || DEFAULT_AVATAR_URL
  );

  useEffect(() => {
    const nextUrl = resolvedTheme.avatarUrl || DEFAULT_AVATAR_URL;
    setAvatarUrl(nextUrl);
  }, [resolvedTheme.avatarUrl]);

  const handleAvatarError = useCallback((event) => {
    if (event?.currentTarget?.dataset?.fallbackApplied === "true") {
      return;
    }
    if (event?.currentTarget) {
      event.currentTarget.dataset.fallbackApplied = "true";
    }
    setAvatarUrl(DEFAULT_AVATAR_URL);
  }, []);

  const primaryRgb = useMemo(
    () =>
      extractRgbChannels(resolvedTheme.primaryColor) ?? DEFAULT_PRIMARY_RGB,
    [resolvedTheme.primaryColor]
  );

  function trackEvent(type, payload) {
    onEvent?.(type, { projectId, microsite, ...payload });

    if (!apiBaseUrl) {
      return;
    }

    fetch(`${apiBaseUrl}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        projectId,
        microsite,
        payload,
      }),
    }).catch((error) => {
      console.error("Failed to record widget event", error);
    });
  }

  function pushSystemMessage(text) {
    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        type: "system",
        text,
        timestamp: Date.now(),
      },
    ]);
  }

  function pushUserMessage(text) {
    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        type: "user",
        text,
        timestamp: Date.now(),
      },
    ]);
  }

  // AI-powered conversation function
  async function getAIResponse(userMessage) {
    if (!apiBaseUrl) {
      console.warn("HomesfyChat: No API base URL, AI disabled");
      return null;
    }
    
    setIsTyping(true);
    try {
      const conversationHistory = messages
        .slice(-10) // Last 10 messages for context
        .map(msg => ({
          type: msg.type,
          text: msg.text,
          timestamp: msg.timestamp
        }));
      
      const payload = {
        message: userMessage,
        conversation: conversationHistory,
        projectId,
        microsite,
        selectedCta,
        selectedBhk,
        propertyInfo: propertyInfo, // Send detected property info to AI
      };
      
      console.log("HomesfyChat: Calling AI endpoint", `${apiBaseUrl}/api/chat`, payload);
      
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("HomesfyChat: AI request failed", response.status, errorText);
        throw new Error(`AI request failed: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.aiUsed) {
        console.log("✅ HomesfyChat: Received AI response from Gemini (gemini-2.5-flash) - full AI capabilities");
      } else if (data.fallback) {
        console.warn("⚠️  HomesfyChat: Received fallback response (keyword matching) - GEMINI_API_KEY not set");
      }
      
      // Check if AI sent a structured action (like request_lead_details)
      if (data.action === "request_lead_details") {
        console.log("🎯 HomesfyChat: AI triggered request_lead_details - switching to form mode");
        // Return object with both message and action
        return {
          text: data.response,
          action: "request_lead_details"
        };
      }
      
      console.log("HomesfyChat: Response data:", { 
        hasResponse: !!data.response, 
        aiUsed: data.aiUsed, 
        fallback: data.fallback,
        model: data.model,
        action: data.action
      });
      return data.response;
    } catch (error) {
      console.error("HomesfyChat: AI error", error);
      return null;
    } finally {
      setIsTyping(false);
    }
  }

  const openChatOnce = () => {
    if (autoOpenTimeoutRef.current) {
      clearTimeout(autoOpenTimeoutRef.current);
      autoOpenTimeoutRef.current = null;
    }

    setIsOpen(true);

    if (!hasShownRef.current) {
      hasShownRef.current = true;
    pushSystemMessage(resolvedTheme.welcomeMessage);
    trackEvent("chat_shown");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    if (autoOpenTimeoutRef.current) {
      clearTimeout(autoOpenTimeoutRef.current);
      autoOpenTimeoutRef.current = null;
    }

    if (hasShownRef.current) {
      return undefined;
    }

    const delay = Math.max(0, resolvedTheme.autoOpenDelayMs || 0);

    if (delay === 0) {
      openChatOnce();
      return undefined;
    }

    autoOpenTimeoutRef.current = window.setTimeout(() => {
      openChatOnce();
    }, delay);

    return () => {
      if (autoOpenTimeoutRef.current) {
        clearTimeout(autoOpenTimeoutRef.current);
        autoOpenTimeoutRef.current = null;
      }
    };
  }, [resolvedTheme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const currentUrl = new URL(window.location.href);
    const utm = UTM_PARAMS.reduce((acc, key) => {
      const value = currentUrl.searchParams.get(key);
      if (value) {
        acc[key.replace("utm_", "")] = value;
      }
      return acc;
    }, {});

    setVisitorContext((prev) => ({
      ...prev,
      utm: Object.keys(utm).length ? utm : prev?.utm,
      landingPage: `${currentUrl.pathname}${currentUrl.search}`,
      referrer: document.referrer || prev?.referrer,
      userAgent:
        typeof navigator !== "undefined"
          ? navigator.userAgent
          : prev?.userAgent,
      firstSeenAt: prev?.firstSeenAt || new Date().toISOString(),
    }));

    let cancelled = false;

    fetch("https://ipapi.co/json/")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data) {
          return;
        }

        setVisitorContext((prev) => ({
          ...prev,
          location: {
            city: data.city,
            region: data.region,
            country: data.country_name,
            countryCode: data.country,
            latitude: data.latitude,
            longitude: data.longitude,
            timezone: data.timezone,
          },
          ip: data.ip,
        }));

        if (data.country_calling_code) {
          const normalizedCode = data.country_calling_code.trim();
          const matchedCountry = COUNTRY_PHONE_CODES.find(
            (entry) => entry.code === normalizedCode
          );

          if (matchedCountry) {
            setSelectedCountry((prev) =>
              prev === DEFAULT_COUNTRY ? matchedCountry : prev
            );
          }
        }
      })
      .catch(() => {
        /* silently ignore */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    openChatOnce();
  };

  const handleCtaSelect = (cta) => {
    setSelectedCta(cta);
    pushUserMessage(cta);
    trackEvent("cta_selected", { label: cta });
    setIsTyping(true);

    setTimeout(() => {
      pushSystemMessage(resolvedTheme.ctaAcknowledgement);
    }, 400);

    setTimeout(() => {
      pushSystemMessage(resolvedTheme.bhkPrompt);
      setIsTyping(false);
    }, 1100);
  };

  const handleBhkSelect = (bhk) => {
    setSelectedBhk(bhk);
    setManualInput("");
    pushUserMessage(bhk);
    trackEvent("chat_started", { bhkType: bhk });
    setIsTyping(true);

    setTimeout(() => {
      pushSystemMessage(resolvedTheme.inventoryMessage);
    }, 500);

    setTimeout(() => {
      // Switch to name input mode - same as AI-triggered flow
      setAiInputMode("name");
      console.log("HomesfyChat: BHK selected, switching to NAME input mode");
      pushSystemMessage(resolvedTheme.namePrompt || "Please enter your name");
      setIsTyping(false);
    }, 1500);
  };

  const handleNameSubmit = async (name) => {
    const trimmedName = name.trim();
    
    // 1. Check if it's clearly a question (Escape hatch)
    if (isClearlyAQuestion(trimmedName)) {
      console.log("HomesfyChat: Detected question in name field, switching to chat");
      setAiInputMode("chat");
      setManualInput("");
      setError(null);
      
      pushUserMessage(trimmedName);
      setHasAiConversationStarted(true);
      
      const aiResponse = await getAIResponse(trimmedName);
      if (aiResponse) {
        const responseText = typeof aiResponse === 'object' ? aiResponse.text : aiResponse;
        detectAndSwitchInputMode(aiResponse);
        setTimeout(() => {
          pushSystemMessage(responseText || aiResponse);
        }, 300);
      }
      return false;
    }
    
    // 2. Strict Name Validation
    if (!trimmedName || trimmedName.length < 2) {
      setError("Please enter a valid name (at least 2 characters).");
      return false;
    }
    
    const namePattern = /^[a-zA-Z\s'-]{2,50}$/;
    if (!namePattern.test(trimmedName)) {
      setError("Please enter a valid name (letters only).");
      return false;
    }
    
    // Reject if it looks like a phone number
    if (/^[\d\+\s\-\(\)]+$/.test(trimmedName.replace(/\s/g, ''))) {
      setError("Please enter your name, not a phone number.");
      return false;
    }
    
    // 3. SUCCESS: Handle State Locally (Do NOT call AI)
    setUserName(trimmedName);
    pushUserMessage(trimmedName); // Show name in chat bubble
    
    // CRITICAL: Force the state transition immediately - LOCAL UPDATE ONLY
    setNameSubmitted(true);
    setAiInputMode("phone");
    
    // Clear input/error
    setManualInput("");
    setError(null);
    setIsTyping(true); // Fake typing for realism

    console.log("HomesfyChat: ✅ Name submitted - LOCAL state update only (no AI call)");
    console.log("HomesfyChat: Setting nameSubmitted=true, aiInputMode=phone");

    // 4. Simulate Agent asking for Phone (Local System Message)
    setTimeout(() => {
      setIsTyping(false);
      // This ensures the Country Code dropdown appears because aiInputMode is 'phone'
      pushSystemMessage(`Thanks ${trimmedName}! Now please enter your mobile number to receive the details.`);
      console.log("HomesfyChat: Phone input mode activated, country selector should be visible");
    }, 600);
    
    return true;
  };

  // Unified flow: Both CTA/BHK and AI-triggered flows use aiInputMode for consistent behavior
  // When BHK is selected, aiInputMode is set to "name"
  // When AI asks for name/phone, aiInputMode is set to "name" or "phone"
  const isAiNameMode = aiInputMode === "name" && !nameSubmitted;
  // CRITICAL: Phone input is active when name is submitted AND aiInputMode is "phone"
  const isAiPhoneMode = aiInputMode === "phone" && nameSubmitted && !phoneSubmitted;
  
  // Fallback for structured flow (CTA → BHK) if aiInputMode not set yet
  const isNameStage = Boolean(selectedCta && selectedBhk && !nameSubmitted && aiInputMode === "chat");
  const isPhoneStage = Boolean(selectedCta && selectedBhk && nameSubmitted && !phoneSubmitted && aiInputMode === "chat");
  
  // Combined: aiInputMode takes priority, fallback to structured flow
  // IMPORTANT: Phone input is active when name is submitted AND aiInputMode is phone
  const isNameInputActive = isAiNameMode || isNameStage;
  
  // Phone input is active when:
  // 1. AI phone mode is active (aiInputMode === "phone" && nameSubmitted && !phoneSubmitted)
  // 2. OR structured flow phone stage (CTA/BHK selected, name submitted, aiInputMode is chat)
  const isPhoneInputActive = isAiPhoneMode || isPhoneStage;
  
  // Define replyPlaceholder BEFORE useEffect to avoid initialization error
  // Make it clear what's expected, especially for phone with country code
  const replyPlaceholder = 
    isNameInputActive
      ? "Enter your name"
      : isPhoneInputActive
      ? `Enter your number${selectedCountry?.code ? ` (${selectedCountry.code} selected)` : ''}`
      : !selectedCta
      ? "Write a reply.."
      : !selectedBhk
      ? "Tell us your preferred configuration"
      : "Write a reply..";
  
  // Debug logging - log input mode changes
  useEffect(() => {
    const calculatedIsAiPhoneMode = aiInputMode === "phone" && nameSubmitted && !phoneSubmitted;
    const calculatedIsPhoneStage = Boolean(selectedCta && selectedBhk && nameSubmitted && !phoneSubmitted && aiInputMode === "chat");
    const calculatedIsPhoneInputActive = calculatedIsAiPhoneMode || calculatedIsPhoneStage;
    
    console.log("HomesfyChat: Input mode state - aiInputMode:", aiInputMode, "nameSubmitted:", nameSubmitted, "phoneSubmitted:", phoneSubmitted);
    console.log("HomesfyChat: isNameInputActive:", isNameInputActive, "isPhoneInputActive:", isPhoneInputActive, "isAiPhoneMode:", isAiPhoneMode, "isPhoneStage:", isPhoneStage);
    console.log("HomesfyChat: Phone conditions - isAiPhoneMode:", calculatedIsAiPhoneMode, "isPhoneStage:", calculatedIsPhoneStage, "shouldShowPhone:", calculatedIsPhoneInputActive);
    console.log("HomesfyChat: Placeholder:", replyPlaceholder);
  }, [aiInputMode, isNameInputActive, isPhoneInputActive, nameSubmitted, phoneSubmitted, replyPlaceholder, selectedCta, selectedBhk]);

  const selectedCountryKey = countryOptionKey(
    selectedCountry || DEFAULT_COUNTRY
  );

  const handleManualInputChange = (event) => {
    let nextValue = event.target.value;

    if (isPhoneInputActive) {
      // For phone input: user selects country code from dropdown, then types only digits
      // Remove everything except digits, spaces, and hyphens
      // If user types +, we'll strip it since country code comes from dropdown
      nextValue = nextValue.replace(/[^\d\s-]/g, "");
      
      // Remove any + signs since country code is selected from dropdown
      nextValue = nextValue.replace(/\+/g, "");
      
      // Clean up multiple spaces
      nextValue = nextValue.replace(/\s+/g, " ").trim();
    } else if (isNameInputActive) {
      // Allow letters, spaces, and common name characters
      nextValue = nextValue.replace(/[^a-zA-Z\s'-]/g, "");
    }

    setManualInput(nextValue);

    if (error) {
      setError(null);
    }
  };
  
  // Function to detect if AI is asking for name/phone and switch input mode
  // Enhanced detection with more patterns and better logic
  // Now handles both JSON actions and plain text detection
  const detectAndSwitchInputMode = (aiResponse) => {
    if (!aiResponse) {
      console.log("HomesfyChat: detectAndSwitchInputMode - no response");
      return;
    }
    
    // Handle structured response with action
    let responseText = aiResponse;
    let actionType = null;
    
    if (typeof aiResponse === 'object' && aiResponse !== null) {
      // AI returned structured response with action
      responseText = aiResponse.text || aiResponse.message || String(aiResponse);
      actionType = aiResponse.action;
      console.log("HomesfyChat: Received structured AI response with action:", actionType);
    } else {
      responseText = String(aiResponse);
    }
    
    // If AI explicitly requested lead details via JSON action, switch to COMBINED form mode
    // PRIORITIZE ACTION - Stop here, don't do regex matching
    if (actionType === "request_lead_details") {
      console.log("🎯 HomesfyChat: AI triggered request_lead_details - showing combined form");
      
      // NEW: Show combined form with BOTH name and phone fields together
      setAiInputMode("leadForm");
      setIsLeadFormActive(true);
      setLeadFormName("");
      setLeadFormPhone("");
      setManualInput("");
      setError(null);
      console.log("HomesfyChat: ✅ Switching to COMBINED LEAD FORM (name + phone together)");
      
      return; // STOP HERE. Do not do regex matching if action exists.
    }
    
    console.log("HomesfyChat: detectAndSwitchInputMode called with:", responseText.substring(0, 100));
    console.log("HomesfyChat: Current state - nameSubmitted:", nameSubmitted, "phoneSubmitted:", phoneSubmitted, "aiInputMode:", aiInputMode);
    
    const lowerResponse = responseText.toLowerCase();
    
    // Enhanced detection patterns - comprehensive coverage for AI's various ways of asking
    // These patterns match the AI's sales-focused language from the system prompt
    const namePatterns = [
      /share your name/i,
      /share your name and phone/i,  // When both are mentioned, prioritize name first
      /could you share your name/i,
      /please share your name/i,
      /enter your name/i,
      /what is your name/i,
      /what's your name/i,
      /tell me your name/i,
      /(?:could|can) you (?:please )?share your name/i,
      /(?:could|can) you (?:please )?tell me your name/i,
      /(?:may|can) i (?:please )?have your name/i,
      /your name/i,  // Catch-all for "your name" mentions
      /i need your name/i,
      /to get you|send you|connect you.*(?:share|provide|give).*name/i
    ];
    
    const phonePatterns = [
      /share your (?:name and )?(?:phone|mobile|number)/i,  // "share your name and phone" or "share your phone"
      /share your phone/i,
      /share your mobile/i,
      /share your number/i,
      /could you share your (?:name and )?(?:phone|mobile|number)/i,
      /please share your (?:phone|mobile|number)/i,
      /enter your (?:phone|mobile|number)/i,
      /what is your (?:phone|mobile|number)/i,
      /what's your (?:phone|mobile|number)/i,
      /tell me your (?:phone|mobile|number)/i,
      /contact (?:number|details)/i,
      /mobile number/i,
      /phone number/i,
      /(?:could|can) you (?:please )?share your (?:phone|mobile|number)/i,
      /(?:may|can) i (?:please )?have your (?:phone|mobile|number)/i,
      /(?:could|can) you (?:please )?provide your (?:phone|mobile|number)/i,
      /to (?:get|send|call|connect).*phone|mobile|number/i,
      /(?:call|reach|contact).*phone|mobile|number/i
    ];
    
    // Check if both name and phone are mentioned
    const mentionsName = namePatterns.some(pattern => pattern.test(lowerResponse));
    const mentionsPhone = phonePatterns.some(pattern => pattern.test(lowerResponse));
    const asksForBoth = mentionsName && mentionsPhone;
    
    console.log("HomesfyChat: Detection - mentionsName:", mentionsName, "mentionsPhone:", mentionsPhone, "asksForBoth:", asksForBoth);
    
    // Priority: if both mentioned, check what's already submitted
    let shouldSwitch = false;
    let newMode = aiInputMode;
    
    // Priority logic: Always collect name first, then phone
    // This ensures we have the name before asking for phone
    if (asksForBoth) {
      // AI asked for both name and phone
      if (!nameSubmitted) {
        // Name not submitted yet - switch to name input first
        newMode = "name";
        shouldSwitch = true;
        console.log("HomesfyChat: ✅ Switching to NAME input mode (AI asked for name and phone, collecting name first)");
      } else if (nameSubmitted && !phoneSubmitted) {
        // Name submitted, now switch to phone input
        newMode = "phone";
        shouldSwitch = true;
        console.log("HomesfyChat: ✅ Switching to PHONE input mode (name submitted, now collecting phone)");
      }
    } else if (mentionsName && !nameSubmitted) {
      // Only name mentioned and not submitted
      newMode = "name";
      shouldSwitch = true;
      console.log("HomesfyChat: ✅ Switching to NAME input mode (AI asked for name)");
    } else if (mentionsPhone && !phoneSubmitted) {
      // Only phone mentioned
      if (!nameSubmitted) {
        // Phone asked but name not submitted - always ask for name first
        newMode = "name";
        shouldSwitch = true;
        console.log("HomesfyChat: ✅ Switching to NAME input mode first (phone asked but name not provided - collecting name first)");
      } else {
        // Name already submitted, now ask for phone
        newMode = "phone";
        shouldSwitch = true;
        console.log("HomesfyChat: ✅ Switching to PHONE input mode (name submitted, AI asked for phone)");
      }
    } else {
      console.log("HomesfyChat: No input mode switch needed - mentionsName:", mentionsName, "mentionsPhone:", mentionsPhone, "nameSubmitted:", nameSubmitted, "phoneSubmitted:", phoneSubmitted);
    }
    
    // Only update if we need to switch
    if (shouldSwitch && newMode !== aiInputMode) {
      console.log("HomesfyChat: ✅ Setting aiInputMode from", aiInputMode, "to", newMode);
      setAiInputMode(newMode);
      // Force a re-render by clearing and setting input
      setManualInput("");
      // Clear any errors when switching modes
      setError(null);
    } else if (!shouldSwitch) {
      console.log("HomesfyChat: No switch needed - shouldSwitch:", shouldSwitch, "newMode:", newMode, "current aiInputMode:", aiInputMode);
    }
  };
  
  // Removed toggleToChatMode - seamless flow like CTA_OPTIONS, no back button

  // VERY STRICT detection - only switch to chat if it's clearly a question
  // We prioritize accuracy - better to ask for name/number again than lose a lead
  const isClearlyAQuestion = (text) => {
    if (!text || text.length < 3) return false;
    
    const trimmed = text.trim();
    const lower = trimmed.toLowerCase();
    
    // ONLY switch if it's VERY clearly a question:
    // 1. Ends with question mark
    // 2. OR starts with obvious question words (what, when, where, why, how, tell me, can you, etc.)
    const questionStarters = [
      'what', 'when', 'where', 'why', 'how', 'who', 'which',
      'tell me', 'can you', 'could you', 'would you', 'show me',
      'explain', 'i want to know', 'i need to know'
    ];
    
    const startsWithQuestion = questionStarters.some(starter => 
      lower.startsWith(starter) && lower.length > starter.length + 2
    );
    
    const endsWithQuestionMark = trimmed.endsWith('?');
    
    // ONLY return true if BOTH conditions suggest it's a question
    // AND it's longer than a typical name (more than 2 words)
    const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length;
    const isLongEnough = wordCount > 2;
    
    // Very conservative: must end with ? OR (start with question word AND be long enough)
    return (endsWithQuestionMark || (startsWithQuestion && isLongEnough)) && isLongEnough;
  };

  async function submitLeadInput(rawInput, providedName = null) {
    setError(null);

    const rawString =
      typeof rawInput === "string" ? rawInput.trim() : String(rawInput || "");

    if (!rawString) {
      setError("Please enter a valid phone number.");
      return false;
    }
    
    // Use provided name if available, otherwise use userName from state
    const nameToUse = providedName || userName || "Guest";

    // IMPORTANT: User selects country code from dropdown, then types only digits
    // We always use the selected country code from the dropdown (not typed)
    const digitsOnly = rawString.replace(/\D/g, "");

      if (!digitsOnly) {
        setError("Please enter a valid phone number.");
        return false;
      }

    // CRITICAL: Require country code selection from dropdown
      const dialCode = selectedCountry?.code;
      if (!dialCode) {
      setError("Please select a country code from the dropdown.");
        return false;
      }

    // Always combine selected country code (from dropdown) with user's digits
    // User should NOT type the country code, they select it from dropdown
    let candidateValue = `${dialCode}${digitsOnly}`;
    
    // If user accidentally typed a country code with +, try to detect and use it instead
    // This is a fallback for users who type the full number
    if (rawString.startsWith("+")) {
      const withPlus = rawString.replace(/[\s().-]/g, "");
      const explicitCountry = pickCountryByDialCode(withPlus);
      
      if (explicitCountry) {
        const subscriberDigits = withPlus.slice(explicitCountry.code.length);
        if (subscriberDigits && /^\d+$/.test(subscriberDigits) && subscriberDigits.length >= 4) {
          // User typed full number with country code, use it and update selection
          candidateValue = `${explicitCountry.code}${subscriberDigits}`;
          setSelectedCountry(explicitCountry);
          console.log("HomesfyChat: Detected country code in input, using:", explicitCountry.code);
        }
      }
    }

    const validationResult = normalizePhoneInput(candidateValue);

    if (validationResult.error) {
      setError(validationResult.error);
      return false;
    }

    try {
      const normalizedPhone = validationResult.value;
      const displayPhone = formatPhoneDisplay(validationResult);

      if (validationResult.country) {
        setSelectedCountry(validationResult.country);
      }

      const submissionMessage = {
        id: generateId(),
        type: "user",
        text: displayPhone || normalizedPhone,
        timestamp: Date.now(),
      };

      const conversationSnapshot = messages.map((message) => ({
        id: message.id,
        type: message.type,
        text: message.text,
        timestamp: message.timestamp,
      }));

      conversationSnapshot.push(submissionMessage);

      // Extract country code and number for Homesfy CRM API
      const countryCode = validationResult.country?.code || "+91";
      // Use the subscriber digits directly from validation result
      let phoneNumber = validationResult.subscriber || "";
      
      // Ensure we have just the digits without country code
      phoneNumber = phoneNumber.replace(/\D/g, "");
      
      // Determine nationality: 1 for India (+91), 2 for others
      const nationality = countryCode === "+91" ? 1 : 2;
      
      // Validate Indian phone numbers (must be 10 digits starting with 6-9)
      if (countryCode === "+91") {
        if (phoneNumber.length !== 10 || !/^[6-9]/.test(phoneNumber)) {
          setError("Invalid phone number. For Indian numbers, enter a valid 10-digit number starting with 6-9.");
          return false;
        }
      }

      // Get project ID for CRM submission
      // Priority: URL param > prop (from data-project or auto-detected) > domain > fallback
      const urlParams = new URLSearchParams(window.location.search);
      const projectIdFromUrl = urlParams.get("project_id") || urlParams.get("projectId");
      
      // Use projectId prop as primary source (comes from data-project attribute or auto-detection)
      // This ensures leads go to the correct project based on manual setting or domain
      const finalProjectId = projectIdFromUrl || projectId || window.location.hostname || "5796";
      
      console.log("HomesfyChat: 📤 Submitting lead to CRM with project ID:", finalProjectId);
      console.log("HomesfyChat: Project ID source:", projectIdFromUrl ? "URL param" : (projectId ? "data-project/auto-detected" : "domain fallback"));

      // Get magnet_id from URL if present
      const magnetId = urlParams.get("magnet_id");

      // Get UTM parameters (matching the provided API structure)
      const utmParams = {};
      UTM_PARAMS.forEach(param => {
        const value = urlParams.get(param);
        if (value) {
          // Map to the format used in the provided API: utm_source -> utmsource, etc.
          const key = param.replace("utm_", "");
          utmParams[`utm${key}`] = value;
        }
      });
      
      // Also check sessionStorage for UTM params (matching provided API behavior)
      UTM_PARAMS.forEach(param => {
        const storedValue = sessionStorage.getItem(param);
        if (storedValue && !utmParams[param.replace("utm_", "utm")]) {
          const key = param.replace("utm_", "");
          utmParams[`utm${key}`] = storedValue;
        }
      });

      // Get device and browser info
      const deviceInfo = navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || 
        navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/Windows Phone/i) 
        ? "Mobile" 
        : navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) 
        ? "Tablet" 
        : "Desktop";

      const browserInfo = navigator.userAgent.indexOf("Chrome") > -1 ? "Chrome" :
        navigator.userAgent.indexOf("Firefox") > -1 ? "Firefox" :
        navigator.userAgent.indexOf("Safari") > -1 ? "Safari" :
        navigator.userAgent.indexOf("Edge") > -1 ? "Edge" : "Other";

      // Get IP address
      let clientIp = "0.0.0.0";
      try {
        const ipResponse = await fetch("https://api.ipify.org/?format=json", { mode: "cors" });
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          clientIp = ipData.ip || "0.0.0.0";
        }
      } catch (err) {
        console.warn("Failed to fetch IP address", err);
      }

      // Prepare payload for Homesfy CRM API (matching the provided API structure)
      // Use nameToUse which comes from parameter or state
      const leadName = nameToUse || userName || "Guest";
      
      console.log("HomesfyChat: Preparing CRM payload - Name:", leadName, "Phone:", phoneNumber, "Country:", countryCode);
      
      const crmPayload = {
        name: leadName,
        email: null, // Not collected in simplified flow
        country_code: countryCode,
        number: phoneNumber,
        tracking_lead_id: magnetId || `chat-${Date.now()}`,
        nationality: nationality,
        source_id: magnetId ? 49 : 31, // 49 for magnet, 31 for regular chat
        project_id: Number(finalProjectId) || Number(projectId) || 5796, // Ensure it's a number
        Digital: {
          user_device: deviceInfo,
          user_browser: browserInfo,
          campaing_type: utmParams.utmcampaign || urlParams.get("utm_campaign") || null, // Note: typo "campaing" matches provided API
          launch_name: "",
          client_ipaddress: clientIp,
          client_pref: null
        }
      };

      // Add UTM params if present (matching the provided API structure)
      if (Object.keys(utmParams).length > 0) {
        crmPayload.Utm = {
          utm_medium: utmParams.utmmedium || null,
          utm_source: utmParams.utmsource || null,
          utm_content: utmParams.utmcontent || null,
          utm_term: utmParams.utmterm || null,
        };
      }

      // Add magnet info if present
      if (magnetId) {
        crmPayload.is_magnet = 1;
        crmPayload.magnet_id = magnetId;
      }

      // Send to Homesfy CRM API - always use production API
      const crmBaseUrl = "https://api.homesfy.in";

      console.log("HomesfyChat: Sending lead to CRM:", JSON.stringify(crmPayload, null, 2));

      const crmResponse = await fetch(`${crmBaseUrl}/api/leads/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(crmPayload),
      });

      const responseText = await crmResponse.text();
      console.log("HomesfyChat: CRM API Response Status:", crmResponse.status);
      console.log("HomesfyChat: CRM API Response:", responseText.substring(0, 500));

      if (!crmResponse.ok) {
        let errorMessage = `Failed to save lead to CRM (${crmResponse.status})`;
        try {
          if (responseText) {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
            console.error("HomesfyChat: CRM API Error:", errorData);
          }
        } catch (e) {
          console.error("HomesfyChat: CRM API Error (non-JSON):", responseText.substring(0, 200));
        }
        throw new Error(errorMessage);
      }
      
      // Parse successful response
      try {
        const responseData = JSON.parse(responseText);
        console.log("HomesfyChat: ✅ Lead saved to CRM successfully:", responseData);
      } catch (e) {
        console.log("HomesfyChat: ✅ Lead saved to CRM (response not JSON)");
      }

      // Also save to local API for dashboard tracking
      try {
        const localPayload = {
        phone: normalizedPhone,
          bhkType: selectedBhk || "Yet to decide",
        microsite: microsite || projectId,
        metadata: {
            projectId: finalProjectId,
            name: userName,
          visitor: {
            ...visitorContext,
            lastInteractionAt: new Date().toISOString(),
          },
          phoneCountry: validationResult.country?.name,
          phoneCountryCode: validationResult.country?.countryCode,
          phoneDialCode: validationResult.country?.code,
          phoneSubscriber: validationResult.subscriber,
        },
        conversation: conversationSnapshot,
      };

        await fetch(`${apiBaseUrl}/api/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
          body: JSON.stringify(localPayload),
        }).catch(() => {
          // Silently fail if local API is not available
      });
      } catch (localErr) {
        console.warn("Failed to save to local API", localErr);
      }

      pushUserMessage(displayPhone || normalizedPhone);
      setPhoneSubmitted(true);
      pushSystemMessage(resolvedTheme.thankYouMessage);
      
      // Switch back to chat mode after successful submission
      // User can now continue chatting if they want
      setAiInputMode("chat");
      console.log("HomesfyChat: ✅ Lead submitted successfully to CRM, switching back to chat mode");
      
      trackEvent("lead_submitted", {
        name: userName,
        bhkType: selectedBhk,
        phoneCountry: validationResult.country?.countryCode,
        projectId: finalProjectId,
      });

      // Push to GTM dataLayer if available (matching the provided API)
      if (typeof window.dataLayer !== "undefined") {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "formSubmitted",
          phone_number: `${countryCode}${phoneNumber}`,
        });
      }
      
      // Store in localStorage (matching the provided API)
      try {
        localStorage.setItem("submittedCountryCode", countryCode);
        localStorage.setItem("submittedPhone", phoneNumber);
      } catch (e) {
        // Ignore localStorage errors
      }

      return true;
    } catch (err) {
      console.error(err);
      setError("We couldn't save your details. Please try again.");
      return false;
    }
  }

  const handleManualSubmit = async (event) => {
    event.preventDefault();

    if (isTyping) {
      return;
    }

    // Combined Lead Form - Check FIRST before other logic
    if (isLeadFormActive || aiInputMode === "leadForm") {
      // Validate both name and phone, then submit together
      const nameValue = leadFormName.trim();
      const phoneValue = leadFormPhone.trim();
      
      // Clear previous errors
      setError(null);
      
      // Validate name
      if (!nameValue || nameValue.length < 2) {
        setError("Please enter a valid name (at least 2 characters).");
        return;
      }
      
      const namePattern = /^[a-zA-Z\s'-]{2,50}$/;
      if (!namePattern.test(nameValue)) {
        setError("Please enter a valid name (letters only).");
        return;
      }
      
      // Validate phone
      if (!phoneValue) {
        setError("Please enter your phone number.");
        return;
      }
      
      // Use selectedCountry for phone submission
      const countryCode = selectedCountry?.code || "+91";
      const normalizedPhone = phoneValue.replace(/\D/g, "");
      
      // Validate phone length
      if (normalizedPhone.length < 4) {
        setError("Please enter a valid phone number.");
        return;
      }
      
      if (countryCode === "+91" && (normalizedPhone.length !== 10 || !/^[6-9]/.test(normalizedPhone))) {
        setError("Invalid phone number. For Indian numbers, enter a valid 10-digit number starting with 6-9.");
        return;
      }
      
      // Set user name FIRST (before submission)
      setUserName(nameValue);
      setNameSubmitted(true);
      setIsTyping(true);
      setError(null);
      
      console.log("HomesfyChat: Submitting combined lead form - Name:", nameValue, "Phone:", `${countryCode}${normalizedPhone}`);
      
      // Submit lead with both name and phone
      // Use a small delay to ensure userName state is set
      try {
        // Create phone string with country code
        const fullPhoneNumber = `${countryCode}${normalizedPhone}`;
        
        // Call submitLeadInput with name explicitly passed
        const success = await submitLeadInput(fullPhoneNumber, nameValue);
        
        if (success) {
          // Success - clear form and reset state
          setLeadFormName("");
          setLeadFormPhone("");
          setManualInput("");
          setIsLeadFormActive(false);
          setAiInputMode("chat");
          setPhoneSubmitted(true);
          setError(null);
          setIsTyping(false);
          
          // Show success message
          pushUserMessage(nameValue);
          pushUserMessage(fullPhoneNumber);
          pushSystemMessage(resolvedTheme.thankYouMessage || "Thank you! We'll reach out to you soon.");
          
          console.log("HomesfyChat: ✅ Combined lead form submitted successfully to CRM");
        } else {
          setError("Failed to submit. Please try again.");
          setIsTyping(false);
        }
      } catch (err) {
        console.error("HomesfyChat: Error submitting combined form:", err);
        setError(err.message || "We couldn't save your details. Please try again.");
        setIsTyping(false);
      }
      return;
    }

    const rawValue = manualInput;
    const trimmed = rawValue.trim();

    // Flow: CTA → BHK → Name → Phone
    
    // Stage 1: CTA selection
    // Check if user is selecting a CTA option or asking a question
    if (!selectedCta) {
      if (!trimmed) {
        return;
      }
      
      // More strict matching - check if input is a clear CTA selection
      // Remove emojis and extra whitespace for comparison
      const normalizedInput = trimmed.toLowerCase().replace(/[^\w\s]/g, '').trim();
      const isCtaSelection = ctaOptions.some(cta => {
        const normalizedCta = cta.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const ctaWords = normalizedCta.split(/\s+/).filter(w => w.length > 2);
        const inputWords = normalizedInput.split(/\s+/);
        
        // Only match if:
        // 1. Exact match
        // 2. Input contains the full CTA text
        // 3. Input is very short (1-2 words) and matches key CTA words like "pricing", "brochure", "quote", "visit", "call"
        const keyCtaWords = ['pricing', 'brochure', 'quote', 'visit', 'tour', 'whatsapp', 'call', 'callback'];
        const isKeyWordMatch = inputWords.length <= 2 && 
                              keyCtaWords.some(keyword => normalizedInput.includes(keyword)) &&
                              ctaWords.some(word => normalizedInput.includes(word));
        
        return normalizedInput === normalizedCta || 
               normalizedInput.includes(normalizedCta) ||
               isKeyWordMatch;
      });
      
      // If it's clearly a CTA selection, handle it
      if (isCtaSelection) {
        setManualInput("");
        handleCtaSelect(trimmed);
        return;
      }
      
      // Otherwise, treat as a question and get AI response
      pushUserMessage(trimmed);
      setManualInput("");
      
      // Mark that AI conversation has started
      setHasAiConversationStarted(true);
      
      const aiResponse = await getAIResponse(trimmed);
      // Handle AI response - can be string or object with action
      if (aiResponse) {
        const responseText = typeof aiResponse === 'object' ? aiResponse.text : aiResponse;
        const actionType = typeof aiResponse === 'object' ? aiResponse.action : null;
        
        // If AI explicitly requested lead details, switch to COMBINED form mode
        if (actionType === "request_lead_details") {
          console.log("🎯 HomesfyChat: AI requested lead details - showing combined form");
          setAiInputMode("leadForm");
          setIsLeadFormActive(true);
          setLeadFormName("");
          setLeadFormPhone("");
          console.log("HomesfyChat: ✅ Switched to COMBINED LEAD FORM (name + phone together)");
        } else {
          // For regular responses, use pattern detection
        detectAndSwitchInputMode(aiResponse);
        }
        
        // Add slight delay for natural feel when showing message
        setTimeout(() => {
          pushSystemMessage(responseText || aiResponse);
        }, 300);
      } else {
        // Fallback if AI is not available
        const fallbackMsg = "I'd love to help you with that! Share your name and phone so I can assist you better.";
        detectAndSwitchInputMode(fallbackMsg);
        setTimeout(() => {
          pushSystemMessage(fallbackMsg);
        }, 300);
      }
      trackEvent("manual_message", { stage: "pre_cta_ai", hasAiResponse: !!aiResponse });
      return;
    }

    // Stage 2: BHK selection
    // Check if user is selecting a BHK option or asking a question
    if (!selectedBhk) {
      if (!trimmed) {
        return;
      }
      
      // More strict matching for BHK - check exact matches or clear BHK patterns
      const normalizedInput = trimmed.toLowerCase().trim();
      const isBhkSelection = bhkOptions.some(bhk => {
        const normalizedBhk = bhk.toLowerCase().trim();
        // Exact match or contains BHK number pattern (1, 2, 3, 4)
        return normalizedInput === normalizedBhk || 
               normalizedInput === normalizedBhk.replace(/\s+/g, ' ') ||
               /^\s*[1-4]\s*bhk\s*$/i.test(normalizedInput) ||
               (normalizedInput.includes('bhk') && /[1-4]/.test(normalizedInput));
      });
      
      if (isBhkSelection) {
        setManualInput("");
        handleBhkSelect(trimmed);
        return;
      }
      
      // Otherwise, treat as a question and get AI response
      pushUserMessage(trimmed);
      setManualInput("");
      
      // Mark that AI conversation has started
      setHasAiConversationStarted(true);
      
      const aiResponse = await getAIResponse(trimmed);
      // Handle AI response - can be string or object with action
      if (aiResponse) {
        const responseText = typeof aiResponse === 'object' ? aiResponse.text : aiResponse;
        
        // Detect and switch input mode IMMEDIATELY
        detectAndSwitchInputMode(aiResponse);
        
        // Add slight delay for natural feel when showing message
        setTimeout(() => {
          pushSystemMessage(responseText || aiResponse);
        }, 300);
      } else {
        // Fallback if AI is not available
        const fallbackMsg = "I'd love to help you with that! Share your name and phone so I can assist you better.";
        detectAndSwitchInputMode(fallbackMsg);
        setTimeout(() => {
          pushSystemMessage(fallbackMsg);
        }, 300);
      }
      trackEvent("manual_message", { stage: "pre_bhk_ai", hasAiResponse: !!aiResponse });
      return;
    }

    // Stage 3: Name collection (structured flow or AI-triggered)
    if (isNameInputActive) {
      // Check if it's clearly a question (very strict) - escape hatch
      if (isClearlyAQuestion(trimmed)) {
        console.log("HomesfyChat: User asked question in name field, switching to chat");
        setAiInputMode("chat");
        setManualInput("");
        setError(null);
        
        pushUserMessage(trimmed);
        setHasAiConversationStarted(true);
        
        const aiResponse = await getAIResponse(trimmed);
        if (aiResponse) {
          const responseText = typeof aiResponse === 'object' ? aiResponse.text : aiResponse;
          detectAndSwitchInputMode(aiResponse);
          setTimeout(() => {
            pushSystemMessage(responseText || aiResponse);
          }, 300);
        }
        return;
      }
      
      // Attempt to submit name. The function now returns TRUE if successful.
      // handleNameSubmit handles state locally (no AI call) and sets aiInputMode="phone"
      const success = await handleNameSubmit(trimmed);
      // If success, handleNameSubmit already set aiInputMode="phone" and cleared input
      return;
    }

    // Stage 4: Phone collection (structured flow or AI-triggered)
    if (isPhoneInputActive) {
      // Check if it's clearly a question (very strict) - escape hatch
      if (isClearlyAQuestion(trimmed)) {
        console.log("HomesfyChat: User asked question in phone field, switching to chat");
        setAiInputMode("chat");
        setManualInput("");
        setError(null);
        
        pushUserMessage(trimmed);
        setHasAiConversationStarted(true);
        
        const aiResponse = await getAIResponse(trimmed);
        if (aiResponse) {
          const responseText = typeof aiResponse === 'object' ? aiResponse.text : aiResponse;
          detectAndSwitchInputMode(aiResponse);
          setTimeout(() => {
            pushSystemMessage(responseText || aiResponse);
          }, 300);
        }
        return;
      }
      
      // This triggers the API call to CRM
      const success = await submitLeadInput(rawValue);
      if (success) {
        setManualInput("");
        setAiInputMode("chat"); // Reset to normal chat after success
        console.log("HomesfyChat: Phone submitted successfully, switched back to chat mode");
      }
      return;
    }


    // Post-lead messages or AI-powered conversation
    // IMPORTANT: If we're in form mode (name/phone input), don't allow chat messages
    // User must complete the form or click "continue chatting"
    if (isNameInputActive || isPhoneInputActive) {
      console.log("HomesfyChat: User tried to send chat message while in form mode, ignoring");
      return;
    }
    
    if (!trimmed) {
      return;
    }

    // Push user message first
    pushUserMessage(trimmed);
    setManualInput("");
    
    // Mark that AI conversation has started as soon as user sends a message
    // This ensures CTA buttons hide immediately
    setHasAiConversationStarted(true);
    
    // Get AI response for natural conversation
    const aiResponse = await getAIResponse(trimmed);
    
    if (aiResponse) {
      const responseText = typeof aiResponse === 'object' ? aiResponse.text : aiResponse;
      const actionType = typeof aiResponse === 'object' ? aiResponse.action : null;
      
        // If AI explicitly requested lead details, switch to COMBINED form mode
        if (actionType === "request_lead_details") {
          console.log("🎯 HomesfyChat: AI requested lead details - showing combined form");
          setAiInputMode("leadForm");
          setIsLeadFormActive(true);
          setLeadFormName("");
          setLeadFormPhone("");
          console.log("HomesfyChat: ✅ Switched to COMBINED LEAD FORM (name + phone together)");
        } else {
        // For regular responses, use pattern detection
      detectAndSwitchInputMode(aiResponse);
      }
      
      // Add slight delay for natural feel when showing message
      setTimeout(() => {
        pushSystemMessage(responseText || aiResponse);
      }, 300);
    } else {
      // Fallback response if AI is not available - use exact phrase that triggers input mode
      const fallbackMsg = "I'd love to help you with that! Share your name and phone so I can assist you better.";
      // Detect in fallback response immediately
      detectAndSwitchInputMode(fallbackMsg);
      
      setTimeout(() => {
        pushSystemMessage(fallbackMsg);
      }, 300);
    }
    
    trackEvent("manual_message", { stage: "ai_conversation", hasAiResponse: !!aiResponse });
  };

  return (
    <div
      className={`homesfy-widget homesfy-widget__${resolvedTheme.bubblePosition} ${
        isOpen ? "homesfy-widget--open" : ""
      }`}
      style={{
        "--homesfy-primary": resolvedTheme.primaryColor,
        "--homesfy-primary-rgb": primaryRgb,
      }}
    >
      {isOpen && (
        <div className="homesfy-widget__window">
          <span className="homesfy-widget__window-glow" aria-hidden />
          <header
            className="homesfy-widget__header"
            style={{ background: resolvedTheme.primaryColor }}
          >
            <div className="homesfy-widget__header-left">
              {avatarUrl && (
                <div className="homesfy-widget__avatar-shell">
                  <img
                    src={avatarUrl}
                    alt={resolvedTheme.agentName}
                    className="homesfy-widget__agent-avatar"
                    onError={handleAvatarError}
                  />
                  <span className="homesfy-widget__avatar-ring" aria-hidden />
                </div>
              )}
              <div className="homesfy-widget__header-copy">
                <p className="homesfy-widget__agent-name">
                  {resolvedTheme.agentName}
                </p>
                <p className="homesfy-widget__agent-status">
                  <span className="homesfy-widget__status-dot" aria-hidden />
                  Live property expert • replies under 2 min
                </p>
              </div>
            </div>
            <button className="homesfy-widget__close" onClick={handleToggle}>
              ×
            </button>
          </header>

          {/* Hero section removed per request */}

          <div className="homesfy-widget__messages">
            {messages.map((message) => {
              const isUser = message.type === "user";

              return (
                <div
                  key={message.id}
                  className={`homesfy-widget__message-row homesfy-widget__message-row--${message.type}`}
                >
                  {!isUser && avatarUrl && (
                    <div className="homesfy-widget__message-avatar homesfy-widget__message-avatar--agent">
                      <img
                        src={avatarUrl}
                        alt={resolvedTheme.agentName}
                        onError={handleAvatarError}
                      />
                    </div>
                  )}

                  <div
                    className={`homesfy-widget__bubble homesfy-widget__bubble--${message.type}`}
                  >
                    {message.text.split("\n").map((line, idx) => {
                      // Parse **bold** markdown and convert to <strong> tags
                      const parts = line.split(/(\*\*[^*]+\*\*)/g);
                      return (
                        <span key={idx}>
                          {parts.map((part, partIdx) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
                            }
                            return <span key={partIdx}>{part}</span>;
                          })}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="homesfy-widget__message-row homesfy-widget__message-row--system">
                {avatarUrl && (
                  <div className="homesfy-widget__message-avatar homesfy-widget__message-avatar--agent">
                    <img
                      src={avatarUrl}
                      alt={resolvedTheme.agentName}
                      onError={handleAvatarError}
                    />
                  </div>
                )}
                <div className="homesfy-widget__bubble homesfy-widget__bubble--system">
                  <span className="homesfy-widget__typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="homesfy-widget__input">
            {/* Stage 1: CTA selection */}
            {!selectedCta && !hasAiConversationStarted && (
              <div className="homesfy-widget__cta-grid">
                {ctaOptions.map((option) => (
                  <button
                    key={option}
                    className="homesfy-widget__cta-button"
                    style={{
                      borderColor: resolvedTheme.primaryColor,
                      color: resolvedTheme.primaryColor,
                    }}
                    onClick={() => handleCtaSelect(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {/* Stage 2: BHK selection */}
            {selectedCta && !selectedBhk && !isTyping && (
              <div className="homesfy-widget__options">
                {bhkOptions.map((option) => (
                  <button
                    key={option}
                    className="homesfy-widget__option-button"
                    style={{
                      borderColor: resolvedTheme.primaryColor,
                      color: resolvedTheme.primaryColor,
                    }}
                    onClick={() => handleBhkSelect(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {phoneSubmitted && (
              <p className="homesfy-widget__footer-note">
                You can close the chat. We'll reach out soon.
              </p>
            )}

            {error && <p className="homesfy-widget__error">{error}</p>}

            {/* --- FIX: Status messages moved OUTSIDE form --- */}
            
            {/* Combined Lead Form - Name + Phone Together */}
            {isLeadFormActive && (
              <>
                {/* Status Message */}
                <div 
                  className="homesfy-widget__form-mode-indicator" 
                  style={{ 
                    fontSize: '12px', 
                    color: resolvedTheme.primaryColor, 
                    fontWeight: '600',
                    marginBottom: '8px',
                    padding: '8px 12px',
                    background: `rgba(${primaryRgb}, 0.08)`,
                    borderRadius: '6px',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>📝</span>
                  <span>Please enter your details</span>
                </div>
                
                {/* Small button to switch back to chat */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      console.log("HomesfyChat: User switched back to chat mode");
                      setIsLeadFormActive(false);
                      setAiInputMode("chat");
                      setLeadFormName("");
                      setLeadFormPhone("");
                      setError(null);
                    }}
                    className="homesfy-widget__continue-chat"
                    style={{
                      color: resolvedTheme.primaryColor,
                      fontSize: '10px',
                      padding: '4px 8px',
                      background: 'transparent',
                      border: `1px solid rgba(${primaryRgb}, 0.3)`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      opacity: 0.8,
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '1'}
                    onMouseLeave={(e) => e.target.style.opacity = '0.8'}
                  >
                    Ask mode →
                  </button>
                </div>
                
                {/* Combined Form with Name and Phone */}
                <form 
                  className="homesfy-widget__form homesfy-widget__form--lead-capture" 
                  onSubmit={handleManualSubmit}
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  {/* Name Field */}
                  <div className="homesfy-widget__input-shell homesfy-widget__input-shell--name">
                    <input
                      type="text"
                      className="homesfy-widget__field homesfy-widget__field--name"
                      placeholder="Enter your name"
                      value={leadFormName}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^a-zA-Z\s'-]/g, "");
                        setLeadFormName(value);
                        if (error) setError(null);
                      }}
                      disabled={isTyping || phoneSubmitted}
                      autoComplete="name"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  </div>
                  
                  {/* Phone Field with Country Selector */}
                  <div className="homesfy-widget__input-shell homesfy-widget__input-shell--phone">
                    <div className="homesfy-widget__country" title={`Selected: ${selectedCountry?.name || 'Country'}`}>
                      <label className="homesfy-widget__country-label">
                        <span className="sr-only">Country code</span>
                        <select
                          aria-label="Country code"
                          className="homesfy-widget__country-select"
                          value={selectedCountryKey}
                          onChange={(event) => {
                            const next = findCountryByKey(event.target.value);
                            if (next) {
                              setSelectedCountry(next);
                              if (error) setError(null);
                            }
                          }}
                          disabled={isTyping}
                        >
                          {COUNTRY_PHONE_CODES.map((country) => (
                            <option
                              key={countryOptionKey(country)}
                              value={countryOptionKey(country)}
                              title={country.name}
                            >
                              {country.code}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    
                    <input
                      type="tel"
                      className="homesfy-widget__field homesfy-widget__field--phone"
                      placeholder={`Enter your number${selectedCountry?.code ? ` (${selectedCountry.code} selected)` : ''}`}
                      value={leadFormPhone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d\s-]/g, "");
                        setLeadFormPhone(value);
                        if (error) setError(null);
                      }}
                      disabled={isTyping || phoneSubmitted}
                      inputMode="tel"
                      autoComplete="tel"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  </div>
                  
                  {/* Submit Button - Styled to match input fields */}
                  <button
                    type="submit"
                    className="homesfy-widget__submit homesfy-widget__submit--combined"
                    style={{ 
                      background: resolvedTheme.primaryColor,
                      width: '100%',
                      marginTop: '8px',
                      padding: '14px 20px',
                      borderRadius: '10px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      opacity: (isTyping || !leadFormName.trim() || !leadFormPhone.trim() || phoneSubmitted) ? 0.5 : 1,
                    }}
                    disabled={isTyping || !leadFormName.trim() || !leadFormPhone.trim() || phoneSubmitted}
                    title="Submit lead"
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    Submit Details
                  </button>
                </form>
              </>
            )}
            
            {/* 1. Status Message for Sequential Flow (MOVED OUTSIDE FORM) */}
            {(isNameInputActive || isPhoneInputActive) && !isLeadFormActive && (
              <div 
                className="homesfy-widget__form-mode-indicator" 
                style={{ 
                  fontSize: '12px', 
                  color: resolvedTheme.primaryColor, 
                  fontWeight: '600',
                  marginBottom: '8px',
                  padding: '8px 12px',
                  background: `rgba(${primaryRgb}, 0.08)`,
                  borderRadius: '6px',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>{isNameInputActive ? '📝' : '📞'}</span>
                <span>{isNameInputActive ? 'Please enter your name' : 'Almost there! Enter your number'}</span>
              </div>
            )}
            
            {/* 2. Continue Chatting Link for Sequential Flow (MOVED OUTSIDE FORM) */}
            {(isNameInputActive || isPhoneInputActive) && !isLeadFormActive && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    console.log("HomesfyChat: User clicked continue chatting");
                    setAiInputMode("chat");
                    setManualInput("");
                    setError(null);
                  }}
                  className="homesfy-widget__continue-chat"
                  style={{
                    color: resolvedTheme.primaryColor,
                    fontSize: '11px',
                    padding: '2px 6px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    opacity: 0.8,
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '1'}
                  onMouseLeave={(e) => e.target.style.opacity = '0.8'}
                >
                  or continue chatting →
                </button>
              </div>
            )}

            {/* 3. Sequential Form (Name or Phone separately) - Only show if NOT combined form */}
            {!isLeadFormActive && (
              <form 
                className={`homesfy-widget__form ${isNameInputActive || isPhoneInputActive ? 'homesfy-widget__form--lead-capture' : ''}`} 
                onSubmit={handleManualSubmit}
              >
              <div
                className={`homesfy-widget__input-shell${
                  isPhoneInputActive ? " homesfy-widget__input-shell--phone" : ""
                }${isNameInputActive ? " homesfy-widget__input-shell--name" : ""}`}
              >
                {isPhoneInputActive && (
                  <div className="homesfy-widget__country" title={`Selected: ${selectedCountry?.name || 'Country'}`}>
                    <label className="homesfy-widget__country-label">
                      <span className="sr-only">Country code</span>
                      <select
                        aria-label="Country code"
                        className="homesfy-widget__country-select"
                        value={selectedCountryKey}
                        onChange={(event) => {
                          const next = findCountryByKey(event.target.value);
                          if (next) {
                            setSelectedCountry(next);
                            if (error) {
                              setError(null);
                            }
                            console.log("HomesfyChat: Country code selected:", next.code, next.name);
                          }
                        }}
                        disabled={isTyping}
                      >
                        {COUNTRY_PHONE_CODES.map((country) => (
                          <option
                            key={countryOptionKey(country)}
                            value={countryOptionKey(country)}
                            title={country.name}
                          >
                            {country.code}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                <input
                  type={isPhoneInputActive ? "tel" : "text"}
                  className={`homesfy-widget__field${
                    isPhoneInputActive ? " homesfy-widget__field--phone" : ""
                  }${isNameInputActive ? " homesfy-widget__field--name" : ""}`}
                  placeholder={replyPlaceholder}
                  value={manualInput}
                  onChange={handleManualInputChange}
                  disabled={isTyping || phoneSubmitted}
                  inputMode={isPhoneInputActive ? "tel" : isNameInputActive ? "text" : "text"}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
              
              <button
                type="submit"
                className="homesfy-widget__submit"
                style={{ background: resolvedTheme.primaryColor }}
                disabled={isTyping || !manualInput.trim() || phoneSubmitted}
                title={isNameInputActive ? "Submit name" : isPhoneInputActive ? "Submit phone number" : "Send message"}
              >
                {isNameInputActive || isPhoneInputActive ? "✓" : "➤"}
              </button>
            </form>
            )}
          </div>
        </div>
      )}

      <button
        className="homesfy-widget__bubble-button"
        style={{ background: resolvedTheme.primaryColor }}
        onClick={handleToggle}
      >
        <span className="homesfy-widget__bubble-glow" aria-hidden />
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt="Agent"
            className="homesfy-widget__bubble-avatar"
            onError={handleAvatarError}
          />
        )}
        <div className="homesfy-widget__bubble-text">
          <span className="homesfy-widget__bubble-title">
            {resolvedTheme.bubbleTitle}
          </span>
          <span className="homesfy-widget__bubble-subtitle">
            {resolvedTheme.bubbleSubtitle}
          </span>
        </div>
      </button>
    </div>
  );
}

