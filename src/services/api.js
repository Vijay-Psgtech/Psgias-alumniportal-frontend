import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: true,
});

// RESPONSE INTERCEPTOR — handle 401/403 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const message = error.response?.data?.message || error.message;

    console.error("❌ API Error:", { status, url, message });

    if (status === 401) {
      window.dispatchEvent(new CustomEvent("auth:logout", { detail: { url } }));
    }

    if (status === 403) {
      window.dispatchEvent(new CustomEvent("auth:forbidden"));
    }

    return Promise.reject(error);
  },
);

// ──────────────── API_BASE ──────────────────────── //
export const API_BASE = import.meta.env.VITE_API_URL.replace("/api", "");

// ── Albums API ────────────────────────────────────────────────────────
export const albumsAPI = {
  getAll: () => api.get("/albums"),
  getByYear: (year) => api.post(`/albums/${year}`),
  create: (data) =>
    api.post("/albums", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  update: (id, data) =>
    api.put(`/albums/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  delete: (id) => api.delete(`/albums/${id}`),
};

// ── Events API ────────────────────────────────────────────────────────
export const eventsAPI = {
  getAll: (params) => api.get("/events", { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) =>
    api.post("/events", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  update: (id, data) =>
    api.put(`/events/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  delete: (id) => api.delete(`/events/${id}`),
};

// ── Campaign API ────────────────────────────────────────────────────────
export const campaignsAPI = {
  // Get all campaigns
  getAll: (params) => {
    console.log("📡 Fetching all campaigns...");
    return api.get("/campaigns", { params }).catch((error) => {
      console.error("❌ Failed to fetch campaigns:", error.message);
      throw error;
    });
  },

  // Get single campaign by ID
  getById: (id) => {
    console.log(`📡 Fetching campaign ${id}...`);
    return api.get(`/campaigns/${id}`).catch((error) => {
      console.error(`❌ Failed to fetch campaign ${id}:`, error.message);
      throw error;
    });
  },

  // Create new campaign
  create: (data) => {
    console.log("📤 Creating campaign...", data.title);
    return api
      .post("/campaigns", data)
      .then((response) => {
        console.log("✅ Campaign created:", response.data.campaignId);
        return response;
      })
      .catch((error) => {
        console.error("❌ Campaign creation failed:", error.message);
        throw error;
      });
  },

  // Update campaign
  update: (id, data) => {
    console.log(`📤 Updating campaign ${id}...`);
    return api
      .put(`/campaigns/${id}`, data)
      .then((response) => {
        console.log("✅ Campaign updated:", id);
        return response;
      })
      .catch((error) => {
        console.error(`❌ Campaign update failed:`, error.message);
        throw error;
      });
  },

  // Delete campaign
  delete: (id) => {
    console.log(`📤 Deleting campaign ${id}...`);
    return api
      .delete(`/campaigns/${id}`)
      .then((response) => {
        console.log("✅ Campaign deleted:", id);
        return response;
      })
      .catch((error) => {
        console.error(`❌ Campaign deletion failed:`, error.message);
        throw error;
      });
  },

  // ── CAMPAIGN RESPONSES ──

  // Submit response to campaign
  submitResponse: (campaignId, data) => {
    console.log(`📤 Submitting response to campaign ${campaignId}...`);
    return api
      .post(`/campaigns/${campaignId}/respond`, data)
      .then((response) => {
        console.log("✅ Response submitted successfully");
        return response;
      })
      .catch((error) => {
        console.error("❌ Failed to submit response:", error.message);
        throw error;
      });
  },

  // Get all responses for a campaign
  getResponses: (campaignId, params = {}) => {
    console.log(`📡 Fetching responses for campaign ${campaignId}...`, params);
    return api
      .get(`/campaigns/${campaignId}/responses`, { params })
      .then((response) => {
        console.log(
          `✅ Fetched ${response.data.count || 0} responses from campaign`,
        );
        return response;
      })
      .catch((error) => {
        console.error(
          `❌ Failed to fetch responses for campaign ${campaignId}:`,
          error.message,
        );
        throw error;
      });
  },

  // Get single response
  getResponse: (responseId) => {
    console.log(`📡 Fetching response ${responseId}...`);
    return api.get(`/campaigns/response/${responseId}`).catch((error) => {
      console.error(`❌ Failed to fetch response:`, error.message);
      throw error;
    });
  },

  // Update response status
  updateResponseStatus: (responseId, data) => {
    console.log(`📤 Updating response ${responseId} status...`);
    return api
      .put(`/campaigns/response/${responseId}/status`, data)
      .then((response) => {
        console.log("✅ Response status updated");
        return response;
      })
      .catch((error) => {
        console.error("❌ Failed to update response status:", error.message);
        throw error;
      });
  },

  // Publish response as story
  publishResponse: (responseId, title) => {
    console.log(`📤 Publishing response ${responseId} as story...`);
    return api
      .post(`/campaigns/response/${responseId}/publish`, { title })
      .then((response) => {
        console.log("✅ Response published successfully");
        return response;
      })
      .catch((error) => {
        console.error("❌ Failed to publish response:", error.message);
        throw error;
      });
  },

  // Delete response
  deleteResponse: (responseId) => {
    console.log(`📤 Deleting response ${responseId}...`);
    return api
      .delete(`/campaigns/response/${responseId}`)
      .then((response) => {
        console.log("✅ Response deleted successfully");
        return response;
      })
      .catch((error) => {
        console.error("❌ Failed to delete response:", error.message);
        throw error;
      });
  },

  // Export responses as CSV
  exportResponses: (campaignId, params = {}) => {
    console.log(`📥 Exporting responses for campaign ${campaignId}...`);
    return api
      .get(`/campaigns/${campaignId}/responses/export`, {
        params,
        responseType: "blob",
      })
      .catch((error) => {
        console.error("❌ Failed to export responses:", error.message);
        throw error;
      });
  },

  // Get campaign analytics
  getAnalytics: (campaignId) => {
    console.log(`📊 Fetching analytics for campaign ${campaignId}...`);
    return api
      .get(`/campaigns/${campaignId}/analytics`)
      .then((response) => {
        console.log("✅ Analytics fetched successfully");
        return response;
      })
      .catch((error) => {
        console.error("❌ Failed to fetch analytics:", error.message);
        throw error;
      });
  },
};

// ✅ NOTIFICATION SCROLL SERVICE (for banner scrolling notifications)
export const notificationService = {
  async getActiveNotifications() {
    try {
      const response = await api.get("/notification-scrolls/active");

      // Guard against HTML error pages
      if (typeof response.data === "string") {
        console.error(
          "Server returned HTML instead of JSON — check backend route registration for /notification-scrolls",
        );
        return { success: false, data: [] };
      }

      return { success: true, data: response.data?.data || [] };
    } catch (error) {
      console.warn("Notifications API Error:", error.message);
      return { success: false, data: [] };
    }
  },

  async getAllNotifications() {
    const response = await api.get("/notification-scrolls");
    if (typeof response.data === "string") {
      throw new Error(
        "Route /notification-scrolls not found on backend — got HTML response",
      );
    }
    return response.data;
  },

  async getNotificationById(id) {
    const response = await api.get(`/notification-scrolls/${id}`);
    return response.data;
  },

  async createNotification(data) {
    const response = await api.post("/notification-scrolls", data);
    return response.data;
  },

  async updateNotification(id, data) {
    const response = await api.put(`/notification-scrolls/${id}`, data);
    return response.data;
  },

  async deleteNotification(id) {
    const response = await api.delete(`/notification-scrolls/${id}`);
    return response.data;
  },

  async toggleNotification(id) {
    const response = await api.patch(
      `/notification-scrolls/${id}/toggle-active`,
    );
    return response.data;
  },

  async trackView(id) {
    try {
      const response = await api.patch(`/notification-scrolls/${id}/view`);
      return response.data;
    } catch (error) {
      console.warn("Failed to track notification view:", error.message);
      return null;
    }
  },

  async trackDismiss(id) {
    try {
      const response = await api.patch(`/notification-scrolls/${id}/dismiss`);
      return response.data;
    } catch (error) {
      console.warn("Failed to track notification dismiss:", error.message);
      return null;
    }
  },
};

// ──────── ADMIN USERS API ──────────────────────────────────────────────────────
export const adminUsersAPI = {
  getAll: () => api.get("/users"),
  create: (data) => api.post("/users", data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
};
