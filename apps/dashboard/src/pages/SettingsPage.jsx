import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

const DEFAULT_PROJECT_ID = "default";

export function SettingsPage() {
  const [projectId, setProjectId] = useState(DEFAULT_PROJECT_ID);
  const [formState, setFormState] = useState({});
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    async function loadConfig() {
      setStatus("loading");
      try {
        const response = await api.get(`/widget-config/${projectId}`);
        setFormState(response.data);
        setStatus("idle");
      } catch (error) {
        console.error("Failed to load widget config", error);
        setStatus("error");
      }
    }

    loadConfig();
  }, [projectId]);

  const handleChange = (field) => (event) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("saving");
    try {
      await api.post(`/widget-config/${projectId}`, formState);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to update widget config", error);
      setStatus("error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Widget Settings
          </h2>
          <p className="text-sm text-slate-500">
            Customize the Homesfy chat experience for each microsite.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">Project ID</label>
          <input
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:grid-cols-2"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Agent Name
          </label>
          <input
            value={formState.agentName || ""}
            onChange={handleChange("agentName")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Avatar URL
          </label>
          <input
            value={formState.avatarUrl || ""}
            onChange={handleChange("avatarUrl")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Primary Color
          </label>
          <input
            type="color"
            value={formState.primaryColor || "#6158ff"}
            onChange={handleChange("primaryColor")}
            className="h-10 w-32 cursor-pointer rounded-lg border border-slate-300"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Auto-open Delay (ms)
          </label>
          <input
            type="number"
            min={0}
            step={500}
            value={formState.autoOpenDelayMs || 4000}
            onChange={handleChange("autoOpenDelayMs")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700">
            Welcome Message
          </label>
          <textarea
            rows={3}
            value={formState.welcomeMessage || ""}
            onChange={handleChange("welcomeMessage")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700">
            Follow-up Message
          </label>
          <textarea
            rows={2}
            value={formState.followupMessage || ""}
            onChange={handleChange("followupMessage")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700">
            Phone Prompt
          </label>
          <textarea
            rows={2}
            value={formState.phonePrompt || ""}
            onChange={handleChange("phonePrompt")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700">
            Thank You Message
          </label>
          <textarea
            rows={2}
            value={formState.thankYouMessage || ""}
            onChange={handleChange("thankYouMessage")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="md:col-span-2 flex items-center justify-between pt-4">
          <div className="text-sm text-slate-500">
            Status: {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "error" ? "Error" : "Idle"}
          </div>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}


