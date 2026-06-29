import React, { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Plus,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Pencil,
  Trash2,
  Star,
  TrendingUp,
  BarChart3,
  Loader,
  Grid3x3,
  List,
  ChevronUp,
  ChevronDown,
  MapPin,
  Users,
} from "lucide-react";
import { eventsAPI, API_BASE } from "../../services/api";
import { DeleteModal } from "../../components/admin/AdminSharedUI";
import { EventFormModal } from "../../components/admin/EventFormModal";
import usePageTitle from "../../hooks/usePageTitle";
import { u } from "framer-motion/client";


// Category colors mapping
const CATEGORY_COLORS = {
  Awards: "#667eea",
  Lecture: "#764ba2",
  Sports: "#f093fb",
  Memorial: "#4facfe",
  Congress: "#00f2fe",
  Workshop: "#43e97b",
  Networking: "#fa709a",
  Cultural: "#fee140",
  Other: "#a0aec0",
};

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [notification, setNotification] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'
  const [sortBy, setSortBy] = useState("date"); // 'date', 'title', 'attendees', 'status'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' or 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  usePageTitle("Events Management");

  // ✅ Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // ✅ Fetch all events from API
  const fetchEvents = async () => {
    try {
      setIsFetching(true);
      const response = await eventsAPI.getAll();
      setEvents(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      showNotification("Failed to load events", "error");
      setEvents([]);
    } finally {
      setIsFetching(false);
    }
  };

  // ✅ Notification handling
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ✅ Filter events
  const filtered = events.filter((e) => {
    const q = search.toLowerCase();
    return (
      (e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q)) &&
      (statusFilter === "all" || e.status === statusFilter)
    );
  });

  // ✅ Sort events
  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "date":
          aVal = new Date(a.date);
          bVal = new Date(b.date);
          break;
        case "title":
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case "attendees":
          aVal = parseInt(a.attendees) || 0;
          bVal = parseInt(b.attendees) || 0;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortBy, sortOrder]);

  // ✅ Pagination
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginatedData = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // ✅ Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // ✅ Calculate stats
  const stats = {
    total: events.length,
    upcoming: events.filter((e) => e.status === "upcoming").length,
    completed: events.filter((e) => e.status === "completed").length,
    highlighted: events.filter((e) => e.highlight).length,
  };

  // ✅ Handle save (create/update)
  const handleSave = async (form) => {
    try {
      setIsLoading(true);
      if (modal.data?._id) {
        // Update existing event
        await eventsAPI.update(modal.data._id, form);
        showNotification(
          `✓ Event "${form.title}" updated successfully!`,
          "success",
        );
      } else {
        // Create new event
        await eventsAPI.create(form);
        showNotification(
          `✓ Event "${form.title}" created successfully!`,
          "success",
        );
      }
      setModal(null);
      // Refresh events list
      await fetchEvents();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Failed to save event";
      showNotification(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Handle delete
  const handleDelete = async (id, title) => {
    try {
      setIsLoading(true);
      await eventsAPI.delete(id);
      showNotification(`✓ Event "${title}" deleted successfully!`, "success");
      setModal(null);
      // Refresh events list
      await fetchEvents();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete event";
      showNotification(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Format date
  const fmtDate = (d) => {
    try {
      return new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  // ✅ Format time
  const fmtTime = (t) => {
    if (!t) return "N/A";
    const [hours, minutes] = t.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50 mt-16 p-4 sm:p-6 lg:p-24">
      {/* ========== LOADING STATE ========== */}
      {isFetching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div className="text-center">
            <Loader
              size={40}
              className="mx-auto mb-4 text-blue-500 animate-spin"
            />
            <p className="text-gray-600 font-['Outfit',_sans-serif] font-medium">
              Loading events...
            </p>
          </div>
        </motion.div>
      )}
      {/* ========== HEADER ========== */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-['Playfair_Display',_serif] font-extrabold text-[#0c0e1a] mb-2">
              Events Management
            </h1>
            <p className="text-gray-500 font-['Outfit',_sans-serif] text-sm">
              Manage, create, and track all events in one place
            </p>
          </div>
          <button
            onClick={() => setModal({ type: "add" })}
            className="px-6 py-3 rounded-xl border-none bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white font-['Outfit',_sans-serif] font-bold text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 w-full sm:w-auto"
          >
            <Plus size={18} /> Add Event
          </button>
        </div>

        {/* ========== STATS SECTION ========== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-8">
          {[
            {
              label: "Total Events",
              value: stats.total,
              icon: Calendar,
              color: "blue",
              bg: "bg-blue-50",
              iconBg: "bg-blue-100",
              iconColor: "text-blue-600",
            },
            {
              label: "Upcoming",
              value: stats.upcoming,
              icon: Clock,
              color: "emerald",
              bg: "bg-emerald-50",
              iconBg: "bg-emerald-100",
              iconColor: "text-emerald-600",
            },
            {
              label: "Completed",
              value: stats.completed,
              icon: CheckCircle,
              color: "slate",
              bg: "bg-slate-50",
              iconBg: "bg-slate-100",
              iconColor: "text-slate-600",
            },
            {
              label: "Highlighted",
              value: stats.highlighted,
              icon: Star,
              color: "amber",
              bg: "bg-amber-50",
              iconBg: "bg-amber-100",
              iconColor: "text-amber-600",
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`${stat.bg} relative p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300`}
              >
                {" "}
                {/* Icon */}{" "}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg} ${stat.iconColor} mb-4`}
                >
                  {" "}
                  <Icon size={18} />{" "}
                </div>{" "}
                {/* Label */}{" "}
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  {" "}
                  {stat.label}{" "}
                </p>{" "}
                {/* Value */}{" "}
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>{" "}
                {/* Decorative Accent */}{" "}
                <div
                  className={`absolute top-0 right-0 h-full w-1 rounded-r-2xl ${stat.iconBg}`}
                />{" "}
              </motion.div>
            );
          })}{" "}
        </div>
      </div>

      {/* ========== NOTIFICATION ========== */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-xl border flex items-center gap-3 font-['Outfit',_sans-serif] ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle size={18} className="shrink-0" />
            ) : (
              <AlertCircle size={18} className="shrink-0" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== TOOLBAR ========== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 mb-6 shadow-sm shadow-black/5">
        <div className="flex flex-col gap-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, category, or venue…"
                className="w-full py-3 px-4 pl-10 border border-slate-200 rounded-xl font-['Outfit',_sans-serif] text-sm outline-none bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>
          </div>

          {/* Sorting Controls (Only in Table View) */}
          {viewMode === "table" && (
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="text-xs font-semibold text-gray-600 font-['Outfit',_sans-serif] uppercase tracking-wider">
                Sort By:
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: "Date", value: "date" },
                  { label: "Title", value: "title" },
                  { label: "Attendees", value: "attendees" },
                  { label: "Status", value: "status" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      if (sortBy === option.value) {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy(option.value);
                        setSortOrder("asc");
                      }
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-bold font-['Outfit',_sans-serif] border transition-all flex items-center gap-1 ${
                      sortBy === option.value
                        ? "bg-[#764ba2] text-white border-[#764ba2]"
                        : "bg-white text-gray-600 border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    {option.label}
                    {sortBy === option.value &&
                      (sortOrder === "asc" ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      ))}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status Filter and View Toggle */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm shadow-black/5">
              {["all", "upcoming", "completed"].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`flex-1 sm:flex-none px-4 py-2.5 border-none font-['Outfit',_sans-serif] text-xs sm:text-sm font-bold transition-all capitalize ${
                    statusFilter === f
                      ? "bg-[#667eea] text-white"
                      : "bg-white text-gray-500 hover:bg-slate-50 hover:text-gray-700"
                  }`}
                >
                  {f === "all" ? "All Events" : f}
                </button>
              ))}
            </div>

            {/* View Toggle and Stats */}
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
              <div className="text-xs text-gray-500 font-['Outfit',_sans-serif] font-medium whitespace-nowrap">
                Showing{" "}
                <strong className="text-[#0c0e1a]">
                  {paginatedData.length}
                </strong>{" "}
                of <strong className="text-[#0c0e1a]">{sorted.length}</strong>
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm shadow-black/5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 transition-all ${
                    viewMode === "grid"
                      ? "bg-[#667eea] text-white"
                      : "bg-white text-gray-500 hover:bg-slate-50 hover:text-gray-700"
                  }`}
                  title="Grid View"
                >
                  <Grid3x3 size={16} />
                </button>
                <div className="w-px bg-slate-200"></div>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2.5 transition-all ${
                    viewMode === "table"
                      ? "bg-[#764ba2] text-white"
                      : "bg-white text-gray-500 hover:bg-slate-50 hover:text-gray-700"
                  }`}
                  title="Table View"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== EVENTS LIST / GRID ========== */}
      <div className="space-y-4">
        {sorted.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 p-12 text-center"
          >
            <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-bold text-gray-700 font-['Outfit',_sans-serif] mb-1">
              No events found
            </h3>
            <p className="text-sm text-gray-500 font-['Outfit',_sans-serif]">
              {search || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first event!"}
            </p>
          </motion.div>
        ) : viewMode === "grid" ? (
          <>
            {/* GRID VIEW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedData.map((event, idx) => {
                const cc = CATEGORY_COLORS[event.category] || "#667eea";
                return (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm shadow-black/5 hover:shadow-md hover:shadow-black/8 transition-all duration-300 group"
                  >
                    {/* ========== EVENT HEADER ========== */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                      <div className="flex-1">
                        {/* Title with highlight badge */}
                        <div className="flex items-center gap-2 mb-2">
                          {event.highlight && (
                            <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-full border border-amber-200">
                              <Star
                                size={11}
                                className="fill-amber-500 text-amber-500"
                              />
                              <span className="text-[10px] font-bold font-['Outfit',_sans-serif]">
                                Featured
                              </span>
                            </div>
                          )}
                          <h3 className="text-lg font-bold text-[#0c0e1a] font-['Playfair_Display',_serif] line-clamp-2">
                            {event.title}
                          </h3>
                        </div>

                        {/* Category and Venue */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="inline-block rounded-full px-3 py-1 text-[10px] font-bold font-['Outfit',_sans-serif] tracking-wider border"
                            style={{
                              background: `${cc}15`,
                              color: cc,
                              borderColor: `${cc}30`,
                            }}
                          >
                            {event.category}
                          </span>
                          <span className="text-xs text-gray-500 font-['Outfit',_sans-serif]">
                            {event.venue?.split(",")[0]}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold font-['Outfit',_sans-serif] uppercase tracking-wider whitespace-nowrap border ${
                          event.status === "upcoming"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {event.status === "upcoming" ? (
                          <Clock size={11} />
                        ) : (
                          <CheckCircle size={11} />
                        )}
                        {event.status === "upcoming" ? "Upcoming" : "Completed"}
                      </div>
                    </div>

                    {/* Event imageUrl */}
                    {event.imageUrl && (
                      <img
                        src={`${API_BASE}/${event.imageUrl}`}
                        alt={event.title}
                        className="w-full h-32 object-cover rounded-lg mb-4"
                      />
                    )}

                    {/* ========== EVENT DETAILS ========== */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-['Outfit',_sans-serif] mb-1">
                          Date
                        </p>
                        <p className="text-sm font-semibold text-[#0c0e1a] font-['Outfit',_sans-serif]">
                          {fmtDate(event.date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-['Outfit',_sans-serif] mb-1">
                          Time
                        </p>
                        <p className="text-sm font-semibold text-[#0c0e1a] font-['Outfit',_sans-serif]">
                          {fmtTime(event.time)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-['Outfit',_sans-serif] mb-1">
                          Attendees
                        </p>
                        <p className="text-sm font-semibold text-[#0c0e1a] font-['Outfit',_sans-serif]">
                          {event.attendees || "0"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-['Outfit',_sans-serif] mb-1">
                          Location
                        </p>
                        <p className="text-sm font-semibold text-[#0c0e1a] font-['Outfit',_sans-serif] truncate">
                          {event.venue?.split(",")[1] || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    {event.description && (
                      <p className="text-xs text-gray-600 font-['Outfit',_sans-serif] line-clamp-2 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        {event.description}
                      </p>
                    )}

                    {/* ========== ACTIONS ========== */}
                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setModal({ type: "edit", data: event })}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 border border-blue-200 hover:bg-blue-50 rounded-lg bg-white text-blue-600 font-['Outfit',_sans-serif] text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        onClick={() =>
                          setModal({ type: "delete", data: event })
                        }
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 border border-red-200 hover:bg-red-50 rounded-lg bg-white text-red-600 font-['Outfit',_sans-serif] text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* PAGINATION - GRID VIEW */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold font-['Outfit',_sans-serif] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 rounded-lg text-sm font-bold font-['Outfit',_sans-serif] transition-all ${
                        currentPage === page
                          ? "bg-blue-500 text-white border border-blue-500"
                          : "border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold font-['Outfit',_sans-serif] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* TABLE VIEW */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm shadow-black/5">
              {/* Table Header */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-left">
                        <span className="text-xs font-bold font-['Outfit',_sans-serif] uppercase tracking-wider text-gray-600">
                          Event
                        </span>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <span className="text-xs font-bold font-['Outfit',_sans-serif] uppercase tracking-wider text-gray-600">
                          Category
                        </span>
                      </th>
                      <th className="px-6 py-4 text-center">
                        <span className="text-xs font-bold font-['Outfit',_sans-serif] uppercase tracking-wider text-gray-600">
                          Date & Time
                        </span>
                      </th>
                      <th className="px-6 py-4 text-center">
                        <span className="text-xs font-bold font-['Outfit',_sans-serif] uppercase tracking-wider text-gray-600">
                          Attendees
                        </span>
                      </th>
                      <th className="px-6 py-4 text-center">
                        <span className="text-xs font-bold font-['Outfit',_sans-serif] uppercase tracking-wider text-gray-600">
                          Location
                        </span>
                      </th>
                      <th className="px-6 py-4 text-center">
                        <span className="text-xs font-bold font-['Outfit',_sans-serif] uppercase tracking-wider text-gray-600">
                          Status
                        </span>
                      </th>
                      <th className="px-6 py-4 text-center">
                        <span className="text-xs font-bold font-['Outfit',_sans-serif] uppercase tracking-wider text-gray-600">
                          Actions
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((event, idx) => {
                      const cc = CATEGORY_COLORS[event.category] || "#667eea";
                      return (
                        <motion.tr
                          key={event._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group"
                        >
                          {/* Title with Featured Badge */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {event.imageUrl && (
                                <img
                                  src={`${API_BASE}/${event.imageUrl}`}
                                  alt={event.title}
                                  className="w-10 h-10 object-cover rounded-lg shrink-0"
                                />
                              )}
                              <div className="flex items-center gap-2">
                                {event.highlight && (
                                  <Star
                                    size={14}
                                    className="fill-amber-500 text-amber-500 shrink-0"
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-[#0c0e1a] font-['Playfair_Display',_serif] line-clamp-2">
                                    {event.title}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="px-6 py-4">
                            <span
                              className="inline-block rounded-full px-3 py-1 text-[10px] font-bold font-['Outfit',_sans-serif] tracking-wider border"
                              style={{
                                background: `${cc}15`,
                                color: cc,
                                borderColor: `${cc}30`,
                              }}
                            >
                              {event.category}
                            </span>
                          </td>

                          {/* Date & Time */}
                          <td className="px-6 py-4 text-center">
                            <div>
                              <p className="text-sm font-semibold text-[#0c0e1a] font-['Outfit',_sans-serif]">
                                {fmtDate(event.date)}
                              </p>
                              <p className="text-xs text-gray-500 font-['Outfit',_sans-serif]">
                                {fmtTime(event.time)}
                              </p>
                            </div>
                          </td>

                          {/* Attendees */}
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1 text-sm font-semibold text-[#0c0e1a] font-['Outfit',_sans-serif]">
                              <Users size={14} className="text-blue-500" />
                              {event.attendees || "—"}
                            </div>
                          </td>

                          {/* Location */}
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <MapPin
                                size={14}
                                className="text-gray-400 shrink-0"
                              />
                              <p className="text-sm text-gray-600 font-['Outfit',_sans-serif] truncate max-w-[120px]">
                                {event.venue?.split(",")[1] || "N/A"}
                              </p>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold font-['Outfit',_sans-serif] uppercase tracking-wider border ${
                                event.status === "upcoming"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-gray-50 text-gray-600 border-gray-200"
                              }`}
                            >
                              {event.status === "upcoming" ? (
                                <Clock size={11} />
                              ) : (
                                <CheckCircle size={11} />
                              )}
                              {event.status === "upcoming"
                                ? "Upcoming"
                                : "Completed"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() =>
                                  setModal({ type: "edit", data: event })
                                }
                                disabled={isLoading}
                                className="p-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  setModal({ type: "delete", data: event })
                                }
                                disabled={isLoading}
                                className="p-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAGINATION - TABLE VIEW */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 p-4 shadow-sm shadow-black/5">
                <div className="text-sm text-gray-600 font-['Outfit',_sans-serif]">
                  Page <strong>{currentPage}</strong> of{" "}
                  <strong>{totalPages}</strong> ·
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="ml-3 px-2 py-1 border border-slate-200 rounded-lg font-['Outfit',_sans-serif] text-sm bg-white outline-none focus:border-blue-500"
                  >
                    {[5, 10, 25, 50].map((size) => (
                      <option key={size} value={size}>
                        {size} per page
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold font-['Outfit',_sans-serif] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Previous
                  </button>

                  {/* Page buttons */}
                  <div className="flex items-center gap-1">
                    {totalPages <= 5 ? (
                      Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold font-['Outfit',_sans-serif] transition-all ${
                              currentPage === page
                                ? "bg-blue-500 text-white border border-blue-500"
                                : "border border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {page}
                          </button>
                        ),
                      )
                    ) : (
                      <>
                        <button
                          onClick={() => setCurrentPage(1)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold font-['Outfit',_sans-serif] ${
                            currentPage === 1
                              ? "bg-blue-500 text-white border border-blue-500"
                              : "border border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          1
                        </button>
                        {currentPage > 3 && (
                          <span className="px-2 text-gray-400">…</span>
                        )}
                        {currentPage > 2 && currentPage < totalPages - 1 && (
                          <button
                            onClick={() => setCurrentPage(currentPage)}
                            className="w-8 h-8 rounded-lg text-xs font-bold font-['Outfit',_sans-serif] bg-blue-500 text-white border border-blue-500"
                          >
                            {currentPage}
                          </button>
                        )}
                        {currentPage < totalPages - 2 && (
                          <span className="px-2 text-gray-400">…</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold font-['Outfit',_sans-serif] ${
                            currentPage === totalPages
                              ? "bg-blue-500 text-white border border-blue-500"
                              : "border border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold font-['Outfit',_sans-serif] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ========== MODALS ========== */}
      <AnimatePresence>
        {modal?.type === "add" && (
          <EventFormModal
            onSave={handleSave}
            onClose={() => setModal(null)}
            isLoading={isLoading}
          />
        )}
        {modal?.type === "edit" && (
          <EventFormModal
            initial={modal.data}
            onSave={handleSave}
            onClose={() => setModal(null)}
            isLoading={isLoading}
          />
        )}
        {modal?.type === "delete" && (
          <DeleteModal
            label={modal.data.title}
            onConfirm={() => handleDelete(modal.data._id, modal.data.title)}
            onClose={() => setModal(null)}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminEvents;
