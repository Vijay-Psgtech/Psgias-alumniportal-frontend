import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Upload,
  Send,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  Loader,
} from "lucide-react";

// Custom hook to handle campaign data fetching
const useCampaignForm = (initialCampaignId = null) => {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaignId, setCampaignId] = useState(null);
  const [apiUrl, setApiUrl] = useState(null);
  const [formData, setFormData] = useState({});
  const [startTime] = useState(Date.now());

  // Initialize API URL
  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL || "/api";
    setApiUrl(baseUrl);
    console.log("🔗 API URL set to:", baseUrl);
  }, []);

  // Extract campaign ID from various sources
  useEffect(() => {
    let id = initialCampaignId;

    const debugInfo = {
      fromProps: initialCampaignId,
      fromURLQuery: new URLSearchParams(window.location.search).get(
        "campaignId",
      ),
      fromURLPath: window.location.pathname.match(/campaign\/([^/]+)/)?.[1],
      fromLocalStorage: localStorage.getItem("lastCampaignId"),
      currentURL: window.location.href,
    };

    console.log("🔍 Campaign ID Detection Sources:", debugInfo);

    // 1. Check props first
    if (id && id !== "undefined") {
      console.log("✅ Campaign ID from props:", id);
    }

    // 2. Check URL query parameters (?campaignId=xxx)
    if (!id) {
      const urlId = new URLSearchParams(window.location.search).get(
        "campaignId",
      );
      if (urlId && urlId !== "undefined") {
        id = urlId;
        console.log("✅ Campaign ID from URL query:", id);
      }
    }

    // 3. Check URL path (/campaign/xxx)
    if (!id) {
      const pathMatch = window.location.pathname.match(/campaign\/([^/]+)/);
      if (pathMatch && pathMatch[1]) {
        id = pathMatch[1];
        console.log("✅ Campaign ID from path:", id);
      }
    }

    // 4. Check localStorage as fallback
    if (!id) {
      const storedId = localStorage.getItem("lastCampaignId");
      if (storedId && storedId !== "undefined") {
        id = storedId;
        console.log("✅ Campaign ID from localStorage:", id);
      }
    }

    // If no ID found, set error
    if (!id) {
      console.error("❌ No campaign ID found in any source:", debugInfo);
      setError(
        "Campaign ID is missing. Please access this page with a valid campaign link.\n\n" +
          "Expected formats:\n" +
          "• http://localhost:5173/campaign-form?campaignId=YOUR-ID\n" +
          "• http://localhost:5173/campaign/YOUR-ID\n" +
          "• Via props from parent component\n\n" +
          "Check console for more details.",
      );
      setLoading(false);
      return;
    }

    setCampaignId(id);
    localStorage.setItem("lastCampaignId", id);
  }, [initialCampaignId]);

  // Fetch campaign data
  const fetchCampaign = async () => {
    if (!apiUrl || !campaignId) {
      console.log("⏳ Waiting for API URL and campaign ID...");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const fullUrl = `${apiUrl}/campaigns/${campaignId}`;
      console.log("📡 Fetching campaign from:", fullUrl);

      const response = await fetch(fullUrl, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📡 Response status:", response.status, response.statusText);

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        console.error("❌ Invalid response type:", contentType);
        console.error("❌ Response body:", responseText.substring(0, 500));
        throw new Error(
          `Invalid response type: ${contentType}. Check if API server is running.`,
        );
      }

      const data = await response.json();
      console.log("✅ API response:", data);

      // Check if request was successful
      if (!response.ok || !data.success) {
        throw new Error(
          data.message || `Failed to load campaign (HTTP ${response.status})`,
        );
      }

      // Extract campaign data
      if (!data.data) {
        throw new Error("Invalid campaign data received from server");
      }

      const campaignData = data.data || data.campaign;

      // Ensure formFields is an array
      if (!Array.isArray(campaignData.formFields)) {
        campaignData.formFields = [];
      }

      setCampaign(campaignData);
      console.log("✅ Campaign loaded successfully");

      // Initialize form data with empty values
      const initialData = {};
      campaignData.formFields.forEach((field) => {
        if (field.fieldName) {
          initialData[field.fieldName] =
            field.fieldType === "checkbox" ? [] : "";
        }
      });

      setFormData(initialData);
    } catch (err) {
      console.error("❌ Error fetching campaign:", err);
      console.error("❌ Error details:", {
        message: err.message,
        stack: err.stack,
      });

      let userMessage = `Failed to load campaign: ${err.message}`;

      // Provide more helpful error messages
      if (err.message.includes("Unexpected token")) {
        userMessage =
          "❌ Server error: API returned HTML instead of JSON.\n\n" +
          "This usually means:\n" +
          "• API server is down\n" +
          "• Wrong API endpoint\n" +
          "• Server error (500, 503, etc.)\n\n" +
          "Check your API URL: " +
          apiUrl;
      } else if (err.message.includes("Failed to fetch")) {
        userMessage =
          "❌ Network error: Cannot reach API server.\n\n" +
          "Check:\n" +
          "• API server is running\n" +
          "• API URL is correct: " +
          apiUrl +
          "\n" +
          "• CORS is configured correctly";
      } else if (err.message.includes("Invalid response type")) {
        userMessage =
          "❌ Server Configuration Error:\n\n" +
          err.message +
          "\n\nCheck:\n" +
          "• API server is running\n" +
          "• Correct endpoint is being used\n" +
          "• Server is returning JSON";
      }

      setError(userMessage);
      setCampaign(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch campaign when IDs are ready
  useEffect(() => {
    if (campaignId && apiUrl) {
      fetchCampaign();
    }
  }, [campaignId, apiUrl]);

  return {
    campaign,
    loading,
    error,
    formData,
    setFormData,
    campaignId,
    apiUrl,
    startTime,
  };
};

// Main CampaignForm Component
const CampaignForm = ({ campaignId: propCampaignId }) => {
  // Get campaign ID from React Router params (if using path-based routing)
  const { id: pathId } = useParams();

  // Get campaign ID from URL query (if using query-based routing)
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get("campaignId");

  // Use props first, then path, then query
  const initialCampaignId = propCampaignId || pathId || queryId;

  const {
    campaign,
    loading,
    error,
    formData,
    setFormData,
    campaignId,
    apiUrl,
    startTime,
  } = useCampaignForm(initialCampaignId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Handle input changes
  const handleInputChange = (fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Validate form
  const validateForm = () => {
    if (!campaign?.formFields) return true;

    for (const field of campaign.formFields) {
      if (field.required) {
        const value = formData[field.fieldName];

        if (!value || (Array.isArray(value) && value.length === 0)) {
          setSubmitError(`${field.label} is required`);
          return false;
        }
      }
    }

    // Check for email field
    const hasEmailField = campaign.formFields.some(
      (f) => f.fieldType === "email",
    );
    if (hasEmailField && !formData.respondentEmail) {
      setSubmitError("Email is required");
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const payload = {
        respondentName: formData.respondentName || "Anonymous",
        respondentEmail: formData.respondentEmail || "noemail@example.com",
        respondentBatch: formData.respondentBatch || "",
        respondentDepartment: formData.respondentDepartment || "",
        responseData: formData,
        responseTime: Math.round((Date.now() - startTime) / 1000),
      };

      const submitUrl = `${apiUrl}/campaigns/${campaignId}/respond`;

      console.log("📤 Submitting to:", submitUrl);
      console.log("📤 Payload:", payload);

      const res = await fetch(submitUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      console.log("📡 Response:", { status: res.status, data });

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Submission failed");
      }

      console.log("✅ Response submitted successfully");
      setSubmitted(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = "/success";
      }, 2000);
    } catch (err) {
      console.error("❌ Submit error:", err);
      setSubmitError(err.message);
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Loading campaign...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-900 mb-1">
                Error Loading Campaign
              </h3>
              <p className="text-sm text-red-700 whitespace-pre-wrap">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-green-50 border border-green-200 rounded-xl p-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              Thank You!
            </h2>
            <p className="text-green-700 mb-4">
              Your response has been submitted successfully.
            </p>
            <p className="text-sm text-green-600">
              Redirecting you back home...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {campaign.coverImage && (
            <img
              src={campaign.coverImage}
              alt={campaign.title}
              className="w-full h-48 object-cover rounded-2xl mb-6"
            />
          )}

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            {campaign.title}
          </h1>

          <p className="text-slate-600 text-lg mb-4">{campaign.description}</p>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Clock size={16} />
              Ends {new Date(campaign.endDate).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Users size={16} />
              {campaign.totalResponses || 0} responses
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
        >
          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{submitError}</p>
            </div>
          )}

          {/* Form Fields */}
          {campaign.formFields && campaign.formFields.length > 0 ? (
            campaign.formFields.map((field, idx) => (
              <FormField
                key={field.fieldId || idx}
                field={field}
                value={formData[field.fieldName] || ""}
                onChange={(value) => handleInputChange(field.fieldName, value)}
              />
            ))
          ) : (
            <p className="text-slate-600 text-center py-8">
              No form fields configured for this campaign.
            </p>
          )}

          {/* Submit Button */}
          {campaign.formFields && campaign.formFields.length > 0 && (
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition ${
                isSubmitting
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit Response
                </>
              )}
            </motion.button>
          )}
        </motion.form>
      </div>
    </div>
  );
};

// Form Field Component
const FormField = ({ field, value, onChange }) => {
  if (!field.fieldType) {
    return null;
  }

  const baseClasses =
    "w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition";

  return (
    <div className="space-y-2">
      <label className="block font-semibold text-slate-900">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* TEXT */}
      {field.fieldType === "text" && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          className={baseClasses}
          required={field.required}
        />
      )}

      {/* EMAIL */}
      {field.fieldType === "email" && (
        <input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseClasses}
          required={field.required}
        />
      )}

      {/* PHONE */}
      {field.fieldType === "phone" && (
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseClasses}
          required={field.required}
        />
      )}

      {/* DATE */}
      {field.fieldType === "date" && (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClasses}
          required={field.required}
        />
      )}

      {/* TEXTAREA */}
      {field.fieldType === "textarea" && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          minLength={field.minLength}
          maxLength={field.maxLength}
          rows={4}
          className={baseClasses}
          required={field.required}
        />
      )}

      {/* SELECT */}
      {field.fieldType === "select" && (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClasses}
          required={field.required}
        >
          <option value="">Select {field.label}</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {/* RADIO */}
      {field.fieldType === "radio" && (
        <div className="space-y-2">
          {(field.options || []).map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={field.fieldName}
                value={opt}
                checked={value === opt}
                onChange={(e) => onChange(e.target.value)}
                className="w-4 h-4"
                required={field.required}
              />
              <span className="text-slate-700">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {/* CHECKBOX */}
      {field.fieldType === "checkbox" && (
        <div className="space-y-2">
          {(field.options || []).map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(value || []).includes(opt)}
                onChange={(e) => {
                  const current = value || [];
                  const updated = e.target.checked
                    ? [...current, opt]
                    : current.filter((i) => i !== opt);
                  onChange(updated);
                }}
                className="w-4 h-4"
              />
              <span className="text-slate-700">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {/* FILE */}
      {field.fieldType === "file" && (
        <div className="relative">
          <input
            type="file"
            onChange={(e) => onChange(e.target.files?.[0])}
            className={`${baseClasses} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
            required={field.required}
          />
          {field.placeholder && (
            <p className="text-xs text-slate-500 mt-1">{field.placeholder}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CampaignForm;