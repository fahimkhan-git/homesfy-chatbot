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

  const handlePropertyInfoChange = (field) => (event) => {
    setFormState((prev) => ({
      ...prev,
      propertyInfo: {
        ...(prev.propertyInfo || {}),
        [field]: event.target.value,
      },
    }));
  };

  const handleArrayChange = (parentField, field) => (event) => {
    const value = event.target.value;
    const array = value.split(",").map(item => item.trim()).filter(Boolean);
    setFormState((prev) => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField] || {}),
        [field]: array,
      },
    }));
  };

  const handlePricingChange = (bhk) => (event) => {
    setFormState((prev) => ({
      ...prev,
      propertyInfo: {
        ...(prev.propertyInfo || {}),
        pricing: {
          ...(prev.propertyInfo?.pricing || {}),
          [bhk]: event.target.value,
        },
      },
    }));
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
            Follow-up Message (after CTA)
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
            Configuration Prompt
          </label>
          <textarea
            rows={2}
            value={formState.bhkPrompt || ""}
            onChange={handleChange("bhkPrompt")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700">
            Inventory Message
          </label>
          <textarea
            rows={2}
            value={formState.inventoryMessage || ""}
            onChange={handleChange("inventoryMessage")}
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

        {/* Property Information Section for AI */}
        <div className="md:col-span-2 border-t border-slate-200 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Property Information (for AI Conversations)
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Add property details so the AI can answer questions accurately about this microsite.
          </p>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Project Name
              </label>
              <input
                value={formState.propertyInfo?.projectName || ""}
                onChange={handlePropertyInfoChange("projectName")}
                placeholder="e.g., Lodha Park"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Developer
              </label>
              <input
                value={formState.propertyInfo?.developer || ""}
                onChange={handlePropertyInfoChange("developer")}
                placeholder="e.g., Lodha"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Location
              </label>
              <input
                value={formState.propertyInfo?.location || ""}
                onChange={handlePropertyInfoChange("location")}
                placeholder="e.g., Andheri West, Mumbai"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Available BHK (comma-separated)
              </label>
              <input
                value={Array.isArray(formState.propertyInfo?.availableBhk) 
                  ? formState.propertyInfo.availableBhk.join(", ")
                  : formState.propertyInfo?.availableBhk || ""}
                onChange={handleArrayChange("propertyInfo", "availableBhk")}
                placeholder="e.g., 2 BHK, 3 BHK, 4 BHK"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                2 BHK Price
              </label>
              <input
                value={formState.propertyInfo?.pricing?.["2 BHK"] || formState.propertyInfo?.pricing?.["2 Bhk"] || ""}
                onChange={handlePricingChange("2 BHK")}
                placeholder="e.g., ₹1.5 Cr"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                3 BHK Price
              </label>
              <input
                value={formState.propertyInfo?.pricing?.["3 BHK"] || formState.propertyInfo?.pricing?.["3 Bhk"] || ""}
                onChange={handlePricingChange("3 BHK")}
                placeholder="e.g., ₹2.2 Cr"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                4 BHK Price
              </label>
              <input
                value={formState.propertyInfo?.pricing?.["4 BHK"] || formState.propertyInfo?.pricing?.["4 Bhk"] || ""}
                onChange={handlePricingChange("4 BHK")}
                placeholder="e.g., ₹3.5 Cr"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Area
              </label>
              <input
                value={formState.propertyInfo?.area || ""}
                onChange={handlePropertyInfoChange("area")}
                placeholder="e.g., 1200-1800 sq ft"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Amenities (comma-separated)
              </label>
              <input
                value={Array.isArray(formState.propertyInfo?.amenities) 
                  ? formState.propertyInfo.amenities.join(", ")
                  : formState.propertyInfo?.amenities || ""}
                onChange={handleArrayChange("propertyInfo", "amenities")}
                placeholder="e.g., Clubhouse, Gym, Pool, Landscaped Gardens"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Possession
              </label>
              <input
                value={formState.propertyInfo?.possession || ""}
                onChange={handlePropertyInfoChange("possession")}
                placeholder="e.g., Ready to Move"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Special Offers
              </label>
              <input
                value={formState.propertyInfo?.specialOffers || ""}
                onChange={handlePropertyInfoChange("specialOffers")}
                placeholder="e.g., 10% discount on booking"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
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


