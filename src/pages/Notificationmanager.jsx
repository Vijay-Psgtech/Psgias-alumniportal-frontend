import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Edit2,
    Trash2,
    X,
    CheckCircle,
    AlertCircle,
    Save,
    Eye,
} from "lucide-react";
import { notificationService } from "../services/api";

const NotificationManager = ({ onError, onSuccess }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [previewNotification, setPreviewNotification] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        message: "",
        type: "info",
        isActive: false,  // ✅ ADDED: Active toggle
    });

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const res = await notificationService.getActiveNotifications();
            setNotifications(res.data || []);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
            const stored = localStorage.getItem("adminNotifications");
            if (stored) {
                setNotifications(JSON.parse(stored));
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Reset form
    const resetForm = () => {
        setFormData({ title: "", message: "", type: "info", isActive: false });
        setSelectedNotification(null);
        setIsEditMode(false);
        setIsModalOpen(false);
    };

    // Handle edit
    const handleEdit = (notification) => {
        setSelectedNotification(notification);
        setFormData({
            title: notification.title || "",
            message: notification.message || "",
            type: notification.type || "info",
            isActive: notification.isActive || false,  // ✅ LOAD active status
        });
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    // Handle add/update
    const handleSave = async () => {
        if (!formData.title.trim()) {
            onError("Notification title is required");
            return;
        }

        try {
            let updatedNotifications;

            if (isEditMode && selectedNotification) {
                // Update existing
                updatedNotifications = notifications.map((n) =>
                    n._id === selectedNotification._id
                        ? { ...n, ...formData, updatedAt: new Date().toISOString() }
                        : n
                );

                // API call
                await notificationService.updateNotification(selectedNotification._id, formData);

                onSuccess("Notification updated successfully!");
            } else {
                // Create new
                const newNotification = {
                    _id: Date.now().toString(),
                    ...formData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                updatedNotifications = [newNotification, ...notifications];

                // API call
                await notificationService.createNotification(formData);

                onSuccess("Notification created successfully!");
            }

            setNotifications(updatedNotifications);
            localStorage.setItem("adminNotifications", JSON.stringify(updatedNotifications));
            resetForm();
        } catch (err) {
            onError(err.message || "Failed to save notification");
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this notification?")) {
            return;
        }

        try {
            await notificationService.deleteNotification(id);

            const updated = notifications.filter((n) => n._id !== id);
            setNotifications(updated);
            localStorage.setItem("adminNotifications", JSON.stringify(updated));
            onSuccess("Notification deleted successfully!");
        } catch (err) {
            onError(err.message || "Failed to delete notification");
        }
    };

    const getTypeStyles = (type) => {
        const styles = {
            success: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
            warning: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
            info: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
            trending: { color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
            default: { color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
        };
        return styles[type] || styles.default;
    };

    const typeOptions = ["success", "warning", "info", "trending", "default"];

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="w-10 h-10 border-[3px] border-slate-200 border-t-blue-500 rounded-full mx-auto mb-4 animate-spin" />
                    <p className="text-gray-400 font-medium">Loading notifications…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                className="flex justify-between items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
                    <p className="text-slate-600 mt-1">Manage scroll banner notifications</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                >
                    <Plus size={16} /> Create
                </button>
            </motion.div>

            {/* Notifications Grid */}
            {notifications.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-2xl p-12 text-center"
                >
                    <AlertCircle size={48} className="mx-auto text-slate-400 mb-4" />
                    <p className="text-slate-600 text-lg">No notifications yet.</p>
                    <p className="text-slate-500 text-sm">Create one to get started!</p>
                </motion.div>
            ) : (
                <motion.div
                    className="grid gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {notifications.map((notif, idx) => {
                        const typeStyles = getTypeStyles(notif.type);
                        return (
                            <motion.div
                                key={notif._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`bg-white rounded-xl p-5 border ${typeStyles.border} hover:shadow-md transition`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Type Badge */}
                                    <div
                                        className={`${typeStyles.bg} ${typeStyles.color} px-3 py-1.5 rounded-lg text-xs font-semibold uppercase`}
                                    >
                                        {notif.type}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-slate-900 text-lg">
                                                {notif.title}
                                            </h3>
                                            {/* ✅ ADDED: Show active status */}
                                            {notif.isActive ? (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">
                                                    ACTIVE
                                                </span>
                                            ) : (
                                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-semibold">
                                                    INACTIVE
                                                </span>
                                            )}
                                        </div>
                                        {notif.message && (
                                            <p className="text-slate-600 text-sm mt-1">
                                                {notif.message}
                                            </p>
                                        )}
                                        <p className="text-xs text-slate-400 mt-2">
                                            {notif.updatedAt
                                                ? `Updated ${new Date(notif.updatedAt).toLocaleDateString()}`
                                                : `Created ${new Date(notif.createdAt).toLocaleDateString()}`}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() => setPreviewNotification(notif)}
                                            title="Preview"
                                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleEdit(notif)}
                                            title="Edit"
                                            className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(notif._id)}
                                            title="Delete"
                                            className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-1000 flex items-center justify-center p-4"
                        onClick={() => resetForm()}
                    >
                        <motion.div
                            initial={{ scale: 0.92, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.92, y: 20 }}
                            className="bg-white rounded-2xl w-full max-w-lg p-7 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                                <h3 className="text-xl font-bold text-slate-900">
                                    {isEditMode ? "Edit Notification" : "Create Notification"}
                                </h3>
                                <button
                                    onClick={() => resetForm()}
                                    className="p-1 hover:bg-slate-100 rounded-lg transition"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form */}
                            <div className="space-y-5">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Welcome to PSG Alumni Portal"
                                        value={formData.title}
                                        onChange={(e) =>
                                            setFormData({ ...formData, title: e.target.value })
                                        }
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                                    />
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        placeholder="e.g., 🎉 Join our community today"
                                        value={formData.message}
                                        onChange={(e) =>
                                            setFormData({ ...formData, message: e.target.value })
                                        }
                                        rows="3"
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 resize-none"
                                    />
                                </div>

                                {/* Type */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Type
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {typeOptions.map((type) => {
                                            const typeStyles = getTypeStyles(type);
                                            return (
                                                <button
                                                    key={type}
                                                    onClick={() =>
                                                        setFormData({ ...formData, type })
                                                    }
                                                    className={`py-2.5 px-3 rounded-lg font-semibold text-sm uppercase transition ${formData.type === type
                                                        ? `${typeStyles.bg} ${typeStyles.color} border-2 border-current`
                                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                        }`}
                                                >
                                                    {type}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* ✅ ADDED: Active Toggle */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                                        Status
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setFormData({ ...formData, isActive: true })}
                                            className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition ${formData.isActive
                                                ? "bg-green-100 text-green-700 border-2 border-green-600"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                }`}
                                        >
                                            ✅ Active
                                        </button>
                                        <button
                                            onClick={() => setFormData({ ...formData, isActive: false })}
                                            className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition ${!formData.isActive
                                                ? "bg-red-100 text-red-700 border-2 border-red-600"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                }`}
                                        >
                                            ❌ Inactive
                                        </button>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                    <p className="text-xs font-semibold text-slate-600 uppercase mb-2">
                                        Preview
                                    </p>
                                    <div className={`${getTypeStyles(formData.type).bg} ${getTypeStyles(formData.type).color} px-4 py-3 rounded-lg`}>
                                        <p className="font-bold text-sm">{formData.title || "Your title here"}</p>
                                        {formData.message && (
                                            <p className="text-xs mt-1 opacity-90">{formData.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
                                <button
                                    onClick={() => resetForm()}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                >
                                    <Save size={16} /> {isEditMode ? "Update" : "Create"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview Modal */}
            <AnimatePresence>
                {previewNotification && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-1001 flex items-center justify-center p-4"
                        onClick={() => setPreviewNotification(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.92, y: 20 }}
                            className="w-full max-w-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-slate-900 rounded-2xl p-6 text-white">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold">Preview</h3>
                                    <button
                                        onClick={() => setPreviewNotification(null)}
                                        className="p-1 hover:bg-slate-800 rounded-lg transition"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <style>{`
                                        .preview-scroll-item {
                                            display: flex;
                                            align-items: center;
                                            gap: 20px;
                                            padding: 16px 40px;
                                            min-height: 60px;
                                            white-space: nowrap;
                                            width: fit-content;
                                        }
                                    `}</style>

                                <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                                    <div className="preview-scroll-item">
                                        <span className="font-bold text-sm">
                                            {previewNotification.title}
                                        </span>
                                        {previewNotification.message && (
                                            <>
                                                <div className="w-px h-6 bg-slate-600" />
                                                <span className="text-xs opacity-80">
                                                    {previewNotification.message}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <p className="text-xs text-slate-400 mt-4">
                                    This is how your notification will appear in the scroll banner
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationManager;