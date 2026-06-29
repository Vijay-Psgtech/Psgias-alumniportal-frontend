import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Calendar,
  Star,
  Clock,
  CheckCircle,
  Pencil,
  Trash2,
  Loader,
} from "lucide-react";
import { eventsAPI, API_BASE } from "../../services/api";
import { DeleteModal } from "./AdminSharedUI";
import { EventFormModal } from "./EventFormModal";

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

export const EventsTab = ({ onError, onSuccess }) => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
      onError("Failed to load events");
      setEvents([]);
    } finally {
      setIsFetching(false);
    }
  };

  const filtered = events.filter((e) => {
    const q = search.toLowerCase();
    return (
      (e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)) &&
      (statusFilter === "all" || e.status === statusFilter)
    );
  });

  // ✅ Update pagination when filtered results change
  useEffect(() => {
    const itemsPerPage = 5;
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [filtered.length]);

  // pagination logic
  const itemsPerPage = 5;
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // ✅ Handle save (create/update)
  const handleSave = async (form) => {
    console.log("FormData", form);
    console.log(form.imageUrl instanceof File);
    try {
      setIsLoading(true);
      const fd = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          fd.append(key, value);
        }
      });
      if (modal.data?._id) {
        // Update existing event
        await eventsAPI.update(modal.data._id, fd);
        onSuccess(`✓ Event "${form.title}" updated successfully!`);
      } else {
        // Create new event
        await eventsAPI.create(fd);
        onSuccess(`✓ Event "${form.title}" created successfully!`);
      }
      setModal(null);
      // Refresh events list
      await fetchEvents();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Failed to save event";
      onError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Handle delete
  const handleDelete = async (id, title) => {
    try {
      setIsLoading(true);
      await eventsAPI.delete(id);
      onSuccess(`✓ Event "${title}" deleted successfully!`);
      setModal(null);
      // Refresh events list
      await fetchEvents();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete event";
      onError(msg);
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="relative">
      {/* Loading overlay */}
      {isFetching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-40 rounded-2xl"
        >
          <div className="text-center">
            <Loader
              size={32}
              className="mx-auto mb-2 text-blue-500 animate-spin"
            />
            <p className="text-gray-600 font-['Outfit',_sans-serif] text-sm font-medium">
              Loading events...
            </p>
          </div>
        </motion.div>
      )}
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4 border-b border-transparent pb-1">
        <div className="flex-1 min-w-[200px] relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events…"
            className="w-full py-2.5 pr-3.5 pl-9 border border-slate-200 rounded-xl font-['Outfit',_sans-serif] text-[13px] outline-none bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
          />
        </div>
        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm shadow-black/5">
          {["all", "upcoming", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 border-none font-['Outfit',_sans-serif] text-xs font-bold transition-colors capitalize ${statusFilter === f ? "bg-[#667eea] text-white" : "bg-transparent text-gray-400 hover:bg-slate-50 hover:text-gray-600"}`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setModal({ type: "add" })}
          className="px-4 py-2.5 rounded-xl border-none bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white font-['Outfit',_sans-serif] text-[13px] font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-blue-500/40"
        >
          <Plus size={14} /> Add Event
        </button>
      </div>

      <div className="text-xs text-gray-400 font-['Outfit',_sans-serif] mb-3 font-medium">
        Showing <strong className="text-[#0c0e1a]">{filtered.length}</strong> of{" "}
        {events.length} events
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="hidden sm:grid grid-cols-[2.4fr_1fr_1fr_1fr_0.6fr_90px] px-4 py-3 bg-slate-50 border-b border-slate-200">
          {["Title", "Category", "Date", "Status", "Attend.", "Actions"].map(
            (h) => (
              <span
                key={h}
                className="text-[12px] font-bold text-gray-700 tracking-wide font-['Outfit',_sans-serif] uppercase"
              >
                {h}
              </span>
            ),
          )}
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-gray-400 font-['Outfit',_sans-serif]">
            <Calendar size={32} className="mx-auto mb-3 opacity-25" />
            No events found matching your criteria.
          </div>
        )}

        <div className="">
          {paginated.map((ev, i) => {
            const cc = CATEGORY_COLORS[ev.category] || "#667eea";
            return (
              <motion.div
                key={ev._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.025 }}
                className={`flex flex-col sm:grid sm:grid-cols-[2.4fr_1fr_1fr_1fr_0.6fr_90px] px-4 py-3.5 gap-3 sm:gap-2 sm:items-center transition-colors hover:bg-slate-50/80 ${i < filtered.length - 1 ? "border-b border-slate-100" : ""}`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-0.5">
                    {ev.imageUrl && (
                      <img
                        src={`${API_BASE}/${ev.imageUrl}`}
                        alt={ev.title}
                        className="w-10 h-10 object-cover rounded-lg shrink-0"
                      />
                    )}
                    <div className="flex items-center gap-2">
                      {ev.highlight && (
                        <Star
                          size={11}
                          className="fill-amber-500 text-amber-500 shrink-0"
                        />
                      )}
                      <span className="font-semibold text-[16px] text-[#0c0e1a] font-['Outfit',_sans-serif] leading-tight">
                        {ev.title}
                      </span>
                    </div>
                  </div>
                  <span className="text-[12px] text-gray-500 font-['Outfit',_sans-serif] block line-clamp-1">
                    {ev.venue?.split(",")[0]}
                  </span>
                </div>

                <div className="hidden sm:block">
                  <span
                    className="inline-block rounded-full px-2.5 py-1 text-[13px] font-bold font-['Outfit',_sans-serif] tracking-wide"
                    style={{
                      background: `${cc}15`,
                      color: cc,
                      border: `1px solid ${cc}30`,
                    }}
                  >
                    {ev.category}
                  </span>
                </div>
                <span className="text-sm text-gray-500 font-['Outfit',_sans-serif] font-medium hidden sm:block">
                  {fmtDate(ev.date)}
                </span>
                <span
                  className={`hidden sm:inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider ${ev.status === "upcoming" ? "text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full w-max border border-emerald-100" : "text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full w-max border border-gray-200"}`}
                >
                  {ev.status === "upcoming" ? (
                    <Clock size={10} />
                  ) : (
                    <CheckCircle size={10} />
                  )}
                  {ev.status === "upcoming" ? "Upcoming" : "Done"}
                </span>
                <span className="text-[13px] font-bold text-[#0c0e1a] hidden sm:block">
                  {ev.attendees}
                </span>

                <div className="flex gap-2 sm:justify-end mt-2 sm:mt-0">
                  <button
                    onClick={() => setModal({ type: "edit", data: ev })}
                    disabled={isLoading}
                    className={`w-8 h-8 border border-slate-200 rounded-lg bg-white flex items-center justify-center transition-all ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-gray-500 shadow-sm"}`}
                  >
                    <Pencil size={13} className="text-inherit" />
                  </button>
                  <button
                    onClick={() => setModal({ type: "delete", data: ev })}
                    disabled={isLoading}
                    className={`w-8 h-8 border border-slate-200 rounded-lg bg-white flex items-center justify-center transition-all ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-500 shadow-sm"}`}
                  >
                    <Trash2 size={13} className="text-inherit" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-end items-center gap-2 px-4 py-3 bg-slate-50 border-t border-slate-200">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md border border-slate-300 bg-white text-sm font-['Outfit',_sans-serif] ${currentPage === 1 ? "cursor-not-allowed opacity-50" : "hover:bg-slate-100"}`}
            >
              Previous
            </button>
            <span className="text-sm text-gray-500 font-['Outfit',_sans-serif]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md border border-slate-300 bg-white text-sm font-['Outfit',_sans-serif] ${currentPage === totalPages ? "cursor-not-allowed opacity-50" : "hover:bg-slate-100"}`}
            >
              Next
            </button>
          </div>
        )}
      </div>

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
