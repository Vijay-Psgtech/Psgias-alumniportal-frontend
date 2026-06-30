import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Download,
  MessageSquare,
  Star,
  Zap,
  Flag,
  Trash2,
  FileText,
  AlertCircle,
} from "lucide-react";
import { campaignsAPI } from "../../services/api";

const CampaignResponsesManager = ({ campaignId }) => {
  const [responses, setResponses] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchResponses();
  }, [campaignId, statusFilter]);

  // Fetch responses from API
  const fetchResponses = async () => {
    if (!campaignId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await campaignsAPI.getResponses(campaignId, {
        ...(statusFilter && statusFilter !== "all" ? { status: statusFilter } : {}),
      });
      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch responses");
      }

      setResponses(data.responses || data.data || []);
    } catch (err) {
      console.error("Error fetching responses:", err);
      setError(err.message);
      setResponses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Publish response as story
  const handlePublishStory = async (responseId) => {
    const title = prompt("Enter story title:");
    if (!title) return;

    try {
      const response = await campaignsAPI.publishResponse(responseId, title);
      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to publish story");
      }

      setSuccessMessage("Story published successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);

      // Refresh responses
      fetchResponses();
      setSelectedResponse(null);
    } catch (err) {
      console.error("Error publishing story:", err);
      alert(`Error: ${err.message}`);
    }
  };

  // Delete response
  const handleDeleteResponse = async (responseId) => {
    if (!confirm("Are you sure you want to delete this response?")) {
      return;
    }

    try {
      const response = await campaignsAPI.deleteResponse(responseId);
      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to delete response");
      }

      setSuccessMessage("Response deleted successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);

      // Refresh responses
      fetchResponses();
    } catch (err) {
      console.error("Error deleting response:", err);
      alert(`Error: ${err.message}`);
    }
  };

  // Download responses as CSV
  const downloadResponses = async () => {
    try {
      const response = await campaignsAPI.exportResponses(campaignId, {
        ...(statusFilter && statusFilter !== "all" ? { status: statusFilter } : {}),
      });
      const blob = response.data;
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `responses-${campaignId}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setSuccessMessage("Responses downloaded successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error downloading responses:", err);
      alert(`Download failed: ${err.message}`);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Published":
        return "bg-green-100 text-green-800 border-green-300";
      case "Viewed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Submitted":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Flagged":
        return "bg-red-100 text-red-800 border-red-300";
      case "Rejected":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2"
        >
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          {successMessage}
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2"
        >
          <AlertCircle size={18} />
          {error}
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Campaign Responses
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            {responses.length}{" "}
            {responses.length === 1 ? "response" : "responses"} collected
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {responses.length > 0 && (
            <button
              onClick={downloadResponses}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm transition"
            >
              <Download size={16} /> Download CSV
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "Submitted", "Viewed", "Published", "Flagged", "Rejected"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              disabled={isLoading}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 ${
                statusFilter === status
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {status === "all" ? "All Responses" : status}
            </button>
          ),
        )}
      </div>

      {/* Responses Grid */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mb-2"></div>
            <p>Loading responses...</p>
          </div>
        ) : responses.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 font-semibold">No responses yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Responses will appear here once alumni submit the campaign form
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {responses.map((response, idx) => (
              <motion.div
                key={response._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Respondent Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                        {response.respondentName?.charAt(0) || "A"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">
                          {response.respondentName || "Anonymous"}
                        </h3>
                        <p className="text-sm text-slate-600 truncate">
                          {response.respondentEmail}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {response.respondentBatch || "N/A"} •{" "}
                          {response.respondentDepartment || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Response Preview */}
                    {Object.keys(response.responseData || {}).length > 0 && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-1 max-h-20 overflow-hidden">
                        {Object.entries(response.responseData)
                          .slice(0, 2)
                          .map(([key, val]) => (
                            <p
                              key={key}
                              className="text-xs text-slate-600 truncate"
                            >
                              <strong>{key}:</strong>{" "}
                              {Array.isArray(val)
                                ? val.join(", ")
                                : String(val).substring(0, 50)}
                              ...
                            </p>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Status & Stats */}
                  <div className="flex flex-col gap-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                        response.status,
                      )}`}
                    >
                      {response.status || "Unknown"}
                    </span>

                    {response.likes !== undefined && (
                      <div className="text-sm text-slate-600">
                        <p className="font-bold text-slate-900 flex items-center justify-center gap-1">
                          <Star size={12} className="fill-yellow-400" />
                          {response.likes}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-slate-500">
                      {new Date(
                        response.submittedAt || response.createdAt,
                      ).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap justify-end">
                    <button
                      onClick={() => setSelectedResponse(response)}
                      className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition text-xs font-bold flex items-center gap-1"
                      title="View details"
                    >
                      <Eye size={14} />
                    </button>

                    {response.status !== "Published" && (
                      <button
                        onClick={() => handlePublishStory(response._id)}
                        className="px-3 py-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition text-xs font-bold flex items-center gap-1"
                        title="Publish as story"
                      >
                        <Zap size={14} />
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteResponse(response._id)}
                      className="px-3 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition text-xs font-bold flex items-center gap-1"
                      title="Delete response"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <ResponseDetailModal
          response={selectedResponse}
          onClose={() => setSelectedResponse(null)}
          onPublish={() => {
            handlePublishStory(selectedResponse._id);
            setSelectedResponse(null);
          }}
          onDelete={() => {
            handleDeleteResponse(selectedResponse._id);
            setSelectedResponse(null);
          }}
        />
      )}
    </div>
  );
};

// Response Detail Modal
const ResponseDetailModal = ({ response, onClose, onPublish, onDelete }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Response Details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl font-light"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Respondent Info */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <h3 className="font-bold text-slate-900 mb-2">
              {response.respondentName || "Anonymous"}
            </h3>
            <p className="text-sm text-slate-600">{response.respondentEmail}</p>
            {response.respondentBatch && (
              <p className="text-sm text-slate-500 mt-1">
                Batch: {response.respondentBatch}
              </p>
            )}
            {response.respondentDepartment && (
              <p className="text-sm text-slate-500">
                Department: {response.respondentDepartment}
              </p>
            )}
          </div>

          {/* Response Data */}
          {Object.keys(response.responseData || {}).length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900">
                Submitted Information
              </h3>
              {Object.entries(response.responseData).map(([key, value]) => (
                <div
                  key={key}
                  className="border-b border-slate-200 pb-4 last:border-b-0"
                >
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                    {key}
                  </p>
                  <p className="text-slate-700 whitespace-pre-wrap wrap-break-word">
                    {Array.isArray(value) ? value.join(", ") : String(value)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Admin Notes */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">
              Admin Notes
            </label>
            <textarea
              defaultValue={response.adminNotes || ""}
              placeholder="Add notes about this response..."
              rows={4}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Status Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">Status</p>
              <p className="font-semibold text-slate-900">{response.status}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">Submitted</p>
              <p className="font-semibold text-slate-900">
                {new Date(
                  response.submittedAt || response.createdAt,
                ).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
            >
              Close
            </button>
            <button
              onClick={onDelete}
              className="px-6 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 size={16} /> Delete
            </button>
            {response.status !== "Published" && (
              <button
                onClick={onPublish}
                className="px-6 py-2 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 flex items-center gap-2"
              >
                <Zap size={16} /> Publish as Story
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CampaignResponsesManager;