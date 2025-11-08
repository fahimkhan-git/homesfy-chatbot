import axios from "axios";

const buildTimeBaseUrl = import.meta.env.VITE_API_BASE_URL;
const runtimeBaseUrl =
  typeof window !== "undefined" ? window.__HOMESFY_API_BASE_URL : undefined;

function ensureApiBase(raw) {
  if (!raw || typeof raw !== "string") {
    return "https://api-alpha-ten-43.vercel.app/api";
  }

  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return "https://api-alpha-ten-43.vercel.app/api";
  }

  if (/\/api$/i.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed}/api`;
}

export const api = axios.create({
  baseURL: ensureApiBase(runtimeBaseUrl || buildTimeBaseUrl),
});

