import React from "react";
import ReactDOM from "react-dom/client";
import { ChatWidget } from "./ChatWidget.jsx";
import styles from "./styles.css?inline";
import { detectPropertyFromPage } from "./propertyDetector.js";

const mountedWidgets = new Map();

const envApiBaseUrl =
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_WIDGET_API_BASE_URL
    : undefined;

const envDefaultProjectId =
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_WIDGET_DEFAULT_PROJECT_ID
    : undefined;

async function fetchWidgetTheme(apiBaseUrl, projectId) {
  try {
    const response = await fetch(
      `${apiBaseUrl}/api/widget-config/${encodeURIComponent(projectId)}`
    );
    if (!response.ok) {
      throw new Error(`Failed to load widget config for ${projectId}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("HomesfyChat: using fallback theme", error);
    return {};
  }
}

function createEventDispatcher(apiBaseUrl, projectId, microsite) {
  return (type, extra = {}) => {
    try {
      const payload = {
        type,
        projectId,
        microsite,
        payload: { ...extra, at: new Date().toISOString() },
      };

      const body = JSON.stringify(payload);

      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(`${apiBaseUrl}/api/events`, blob);
      } else {
        fetch(`${apiBaseUrl}/api/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    } catch (error) {
      console.warn("HomesfyChat: failed to dispatch event", error);
    }
  };
}

function mountWidget({
  apiBaseUrl,
  projectId,
  microsite,
  theme,
  target,
}) {
  if (mountedWidgets.has(projectId)) {
    return mountedWidgets.get(projectId);
  }

  const host = target ?? document.createElement("div");
  if (!target) {
    document.body.appendChild(host);
  }

  const shadow = host.attachShadow({ mode: "open" });
  const styleTag = document.createElement("style");
  styleTag.textContent = styles;
  shadow.appendChild(styleTag);

  const mountNode = document.createElement("div");
  shadow.appendChild(mountNode);

  const root = ReactDOM.createRoot(mountNode);
  root.render(
    <ChatWidget
      apiBaseUrl={apiBaseUrl}
      projectId={projectId}
      microsite={microsite}
      theme={theme}
      onEvent={createEventDispatcher(apiBaseUrl, projectId, microsite)}
    />
  );

  const instance = {
    destroy() {
      root.unmount();
      mountedWidgets.delete(projectId);
      if (!target) {
        host.remove();
      }
    },
  };

  mountedWidgets.set(projectId, instance);
  return instance;
}

async function init(options = {}) {
  const scriptElement = options.element || document.currentScript;
  const apiBaseUrl =
    options.apiBaseUrl ||
    scriptElement?.dataset.apiBaseUrl ||
    envApiBaseUrl ||
    window?.HOMESFY_WIDGET_API_BASE_URL ||
    "http://localhost:4000";
  const microsite =
    options.microsite || scriptElement?.dataset.microsite || window.location.hostname;

  // PROJECT ID DETECTION: Priority order
  // 1. Manual data-project attribute (highest priority)
  // 2. Options.projectId
  // 3. Environment variable
  // 4. Auto-detect from domain (fallback)
  
  let projectId = 
    options.projectId ||
    scriptElement?.dataset.project ||
    scriptElement?.dataset.projectId ||
    envDefaultProjectId;

  // Check if manual project ID was provided
  const manualProjectId = scriptElement?.dataset.project || scriptElement?.dataset.projectId;
  if (manualProjectId) {
    projectId = manualProjectId;
    console.log("HomesfyChat: ✅ Using MANUAL project ID from data-project attribute:", projectId);
    console.log("HomesfyChat: This project ID will be used for all operations (chat, leads, events)");
  } else if (!projectId || projectId === "default") {
    // Auto-detect from domain only if no manual project ID provided
    try {
      const currentDomain = window.location.hostname;
      console.log("HomesfyChat: No manual project ID found, auto-detecting from domain:", currentDomain);
      
      // Try to fetch project ID from API based on domain
      const domainResponse = await fetch(`${apiBaseUrl}/api/widget-config/domain/${encodeURIComponent(currentDomain)}`);
      if (domainResponse.ok) {
        const domainData = await domainResponse.json();
        projectId = domainData.projectId || currentDomain; // Use domain as projectId if mapping not found
        console.log("HomesfyChat: ✅ Project ID auto-detected from domain:", projectId, "Source:", domainData.source);
      } else {
        // Fallback: use domain as projectId
        projectId = currentDomain;
        console.log("HomesfyChat: Using domain as project ID (auto-detection):", projectId);
      }
    } catch (error) {
      // Fallback: use domain as projectId
      projectId = window.location.hostname || "default";
      console.warn("HomesfyChat: Failed to detect project ID from domain, using:", projectId);
    }
  } else {
    console.log("HomesfyChat: Using project ID from options/environment:", projectId);
  }

  console.log("HomesfyChat: 🎯 Final project ID:", projectId, "| Domain:", window.location.hostname, "| Microsite:", microsite);

  const themeOverrides = options.theme || {};
  const remoteTheme = await fetchWidgetTheme(apiBaseUrl, projectId);
  
  // ALWAYS detect property information from the current page
  // This ensures the widget works on ANY microsite without manual configuration
  let detectedPropertyInfo = detectPropertyFromPage();
  
  // If property detected, send it to API to update config for this project
  if (detectedPropertyInfo && apiBaseUrl && Object.keys(detectedPropertyInfo).length > 0) {
    console.log("HomesfyChat: Detected property from page, sending to API:", detectedPropertyInfo);
    try {
      await fetch(`${apiBaseUrl}/api/widget-config/${encodeURIComponent(projectId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyInfo: detectedPropertyInfo }),
      }).catch(() => {
        // Silently fail - widget will still work with detected info
      });
    } catch (error) {
      console.warn("HomesfyChat: Failed to save detected property info", error);
    }
  }
  
  // Always prioritize detected property info over remote config
  // This allows the same script to work on different microsites
  const theme = { 
    ...remoteTheme, 
    ...themeOverrides,
    // Use detected property info if available, otherwise use remote config
    propertyInfo: detectedPropertyInfo && Object.keys(detectedPropertyInfo).length > 0
      ? detectedPropertyInfo 
      : (remoteTheme?.propertyInfo || {})
  };

  return mountWidget({
    apiBaseUrl,
    projectId,
    microsite,
    theme,
    target: options.target,
  });
}

const HomesfyChat = { init };

if (typeof window !== "undefined") {
  window.HomesfyChat = HomesfyChat;

  if (document.currentScript?.dataset.autoInit !== "false") {
    init();
  }
}

export default HomesfyChat;

