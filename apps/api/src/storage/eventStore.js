import crypto from "crypto";
import { config } from "../config.js";
import { Event } from "../models/Event.js";
import { toPlainObject } from "../utils/doc.js";
import { readJson, writeJson } from "./fileStore.js";

const FILE_NAME = "events.json";
const DEFAULT_STORE = { events: [] };
const useMongo = config.dataStore === "mongo";

async function loadStore() {
  return readJson(FILE_NAME, DEFAULT_STORE);
}

async function saveStore(store) {
  await writeJson(FILE_NAME, store);
}

export async function recordEvent({ type, projectId, microsite, payload }) {
  // On Vercel, if using file store, events might fail due to read-only filesystem
  // Return success even if file write fails to prevent 500 errors
  if (process.env.VERCEL && config.dataStore === "file") {
    console.warn("⚠️  Event recording skipped on Vercel (file store not available)");
    return { type, projectId, microsite, payload, recorded: false };
  }
  if (useMongo) {
    const eventDoc = await Event.create({
      type,
      projectId,
      microsite,
      payload,
    });

    return toPlainObject(eventDoc);
  }

  const now = new Date().toISOString();
  const event = {
    id: crypto.randomUUID(),
    type,
    projectId,
    microsite,
    payload,
    createdAt: now,
  };

  const store = await loadStore();
  store.events = [event, ...store.events];
  await saveStore(store);
  return event;
}

export async function getEventSummary() {
  if (useMongo) {
    const summary = {
      chatsShown: 0,
      chatsStarted: 0,
      leadsCaptured: 0,
    };

    const results = await Event.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    results.forEach((item) => {
      if (item._id === "chat_shown") {
        summary.chatsShown = item.count;
      } else if (item._id === "chat_started") {
        summary.chatsStarted = item.count;
      } else if (item._id === "lead_submitted") {
        summary.leadsCaptured = item.count;
      }
    });

    return summary;
  }

  const store = await loadStore();

  const summary = store.events.reduce(
    (acc, event) => {
      if (event.type === "chat_shown") acc.chatsShown += 1;
      if (event.type === "chat_started") acc.chatsStarted += 1;
      if (event.type === "lead_submitted") acc.leadsCaptured += 1;
      return acc;
    },
    { chatsShown: 0, chatsStarted: 0, leadsCaptured: 0 }
  );

  return summary;
}


