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
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCta, setSelectedCta] = useState(null);
  const [selectedBhk, setSelectedBhk] = useState(null);
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [visitorContext, setVisitorContext] = useState({});
  const messagesEndRef = useRef(null);
  const hasShownRef = useRef(false);
  const [manualInput, setManualInput] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);

  const resolvedTheme = useMemo(
    () => ({
      agentName: theme.agentName || "Pooja Agarwal",
      avatarUrl: resolveAvatarUrl(theme.avatarUrl),
      primaryColor: theme.primaryColor || DEFAULT_PRIMARY_COLOR,
      bubblePosition: theme.bubblePosition || "bottom-right",
      welcomeMessage:
        theme.welcomeMessage ||
        "Hey, I'm Pooja Agarwal! How can I help you understand this project?",
      ctaAcknowledgement:
        theme.ctaAcknowledgement || "Sure… I’ll send that across right away!",
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

  useEffect(() => {
    if (hasShownRef.current) {
      return;
    }

    hasShownRef.current = true;
    setIsOpen(true);
    pushSystemMessage(resolvedTheme.welcomeMessage);
    trackEvent("chat_shown");
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
    setIsOpen((prev) => !prev);
    if (!isOpen && messages.length === 0) {
      pushSystemMessage(resolvedTheme.welcomeMessage);
    }
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
      pushSystemMessage(resolvedTheme.phonePrompt);
      setIsTyping(false);
    }, 1500);
  };

  const isPhoneStage = Boolean(selectedCta && selectedBhk && !phoneSubmitted);

  const replyPlaceholder = !selectedCta
    ? "Write a reply.."
    : !selectedBhk
    ? "Tell us your preferred configuration"
    : !phoneSubmitted
    ? `Enter mobile number (${selectedCountry?.code ?? "+"})`
    : "Write a reply..";

  const selectedCountryKey = countryOptionKey(
    selectedCountry || DEFAULT_COUNTRY
  );

  const handleManualInputChange = (event) => {
    let nextValue = event.target.value;

    if (isPhoneStage) {
      nextValue = nextValue.replace(/[^\d+\s-]/g, "");

      if (nextValue.includes("+")) {
        const leadingPlus = nextValue.startsWith("+") ? "+" : "";
        nextValue =
          leadingPlus + nextValue.replace(/\+/g, "").replace(/[^\d\s-]/g, "");
      }
    }

    setManualInput(nextValue);

    if (error) {
      setError(null);
    }
  };

  async function submitLeadInput(rawInput) {
    setError(null);

    const rawString =
      typeof rawInput === "string" ? rawInput.trim() : String(rawInput || "");

    if (!rawString) {
      setError("Please enter a valid phone number.");
      return false;
    }

    let candidateValue = rawString;

    if (!candidateValue.startsWith("+")) {
      const digitsOnly = candidateValue.replace(/\D/g, "");

      if (!digitsOnly) {
        setError("Please enter a valid phone number.");
        return false;
      }

      const dialCode = selectedCountry?.code;
      if (!dialCode) {
        setError("Select a country code before submitting.");
        return false;
      }

      candidateValue = `${dialCode}${digitsOnly}`;
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

      const payload = {
        phone: normalizedPhone,
        bhkType: selectedBhk,
        microsite: microsite || projectId,
        metadata: {
          projectId,
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

      const response = await fetch(`${apiBaseUrl}/api/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save lead");
      }

      pushUserMessage(displayPhone || normalizedPhone);
      setPhoneSubmitted(true);
      pushSystemMessage(resolvedTheme.thankYouMessage);
      trackEvent("lead_submitted", {
        bhkType: selectedBhk,
        phoneCountry: validationResult.country?.countryCode,
      });
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

    const rawValue = manualInput;
    const trimmed = rawValue.trim();

    if (!selectedCta) {
      if (!trimmed) {
        return;
      }
      setManualInput("");
      handleCtaSelect(trimmed);
      return;
    }

    if (!selectedBhk) {
      if (!trimmed) {
        return;
      }
      setManualInput("");
      handleBhkSelect(trimmed);
      return;
    }

    if (isPhoneStage) {
      const success = await submitLeadInput(rawValue);
      if (success) {
        setManualInput("");
      }
      return;
    }

    if (!trimmed) {
      return;
    }

    pushUserMessage(trimmed);
    trackEvent("manual_message", { stage: "post_lead" });
    setManualInput("");
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
                    {message.text.split("\n").map((line, idx) => (
                      <span key={idx}>{line}</span>
                    ))}
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
            {!selectedCta && (
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

            <form className="homesfy-widget__form" onSubmit={handleManualSubmit}>
              <div
                className={`homesfy-widget__input-shell${
                  isPhoneStage ? " homesfy-widget__input-shell--phone" : ""
                }`}
              >
                {isPhoneStage && (
                  <div className="homesfy-widget__country">
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
                  type="text"
                  className={`homesfy-widget__field${
                    isPhoneStage ? " homesfy-widget__field--phone" : ""
                  }`}
                  placeholder={replyPlaceholder}
                  value={manualInput}
                  onChange={handleManualInputChange}
                  disabled={isTyping}
                  inputMode={isPhoneStage ? "tel" : "text"}
                  autoComplete={isPhoneStage ? "tel" : "off"}
                />
              </div>
              <button
                type="submit"
                className="homesfy-widget__submit"
                style={{ background: resolvedTheme.primaryColor }}
                disabled={isTyping || !manualInput.trim()}
              >
                ➤
              </button>
            </form>
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

