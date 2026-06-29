import React, { useState } from "react";
import { CheckCircle, Upload, X } from "lucide-react";
import { Overlay, ModalHeader, FLabel, Inp, Sel, Txt } from "./AdminSharedUI";
import { API_BASE } from "../../services/api";

const CATEGORIES = [
  "Awards",
  "Reunion",
  "Lecture",
  "Sports",
  "Memorial",
  "Congress",
  "Workshop",
  "Networking",
  "Cultural",
  "Other",
];
const BLANK_EVENT = {
  title: "",
  date: "",
  time: "",
  venue: "PSG College of Arts & Science, Coimbatore",
  description: "",
  status: "upcoming",
  attendees: "",
  category: "Awards",
  highlight: false,
  imageUrl: null,
};

export const EventFormModal = ({ initial, onSave, onClose, isLoading }) => {
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [form, setForm] = useState(() => {
    if (!initial) return BLANK_EVENT;

    return {
      ...initial,
      date: formatDate(initial.date),
    };
  });

  const [imagePreview, setImagePreview] = useState(() => {
    if (initial?.imageUrl && typeof initial.imageUrl === "string") {
      return `${API_BASE}/${initial.imageUrl}`;
    }
    return null;
  });
  const isEdit = !!initial?._id;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      set("imageUrl", file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  };

  const removeImage = () => {
    set("imageUrl", null);
    setImagePreview(null);
  };

  const valid = form.title.trim() && form.date && form.venue.trim();

  return (
    <Overlay onClose={onClose} wide>
      <ModalHeader
        title={isEdit ? "Update Event" : "Add New Event"}
        sub={isEdit ? "✏️ EDITING EVENT" : "➕ NEW EVENT"}
        onClose={onClose}
      />
      <div className="px-7 pt-6 pb-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FLabel label="Event Title" span2>
            <Inp
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Alumni Congress 2027"
              disabled={isLoading}
            />
          </FLabel>

          <FLabel label="Category">
            <Sel
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              disabled={isLoading}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Sel>
          </FLabel>

          <FLabel label="Status">
            <Sel
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              disabled={isLoading}
            >
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </Sel>
          </FLabel>

          <FLabel label="Date">
            <Inp
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              disabled={isLoading}
            />
          </FLabel>

          <FLabel label="Time">
            <Inp
              type="time"
              value={form.time}
              onChange={(e) => set("time", e.target.value)}
              disabled={isLoading}
            />
          </FLabel>

          <FLabel label="Venue" span2>
            <Inp
              value={form.venue}
              onChange={(e) => set("venue", e.target.value)}
              placeholder="Venue name, city"
              disabled={isLoading}
            />
          </FLabel>

          <FLabel label="Expected / Total Attendees">
            <Inp
              type="number"
              value={form.attendees}
              onChange={(e) => set("attendees", e.target.value)}
              placeholder="0"
              min="0"
              disabled={isLoading}
            />
          </FLabel>

          <FLabel label="Highlight Event?">
            <div className="flex gap-2.5 pt-1">
              {[
                { v: true, label: "⭐ Yes" },
                { v: false, label: "No" },
              ].map(({ v, label }) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => set("highlight", v)}
                  disabled={isLoading}
                  className={`flex-1 py-2 rounded-xl border text-[13px] font-semibold font-['Outfit',_sans-serif] transition-all
                                        ${form.highlight === v ? "border-indigo-500 bg-indigo-50 text-indigo-500" : "border-slate-200 bg-[#fafbfd] text-gray-400"}
                                        ${isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-indigo-300"}
                                    `}
                >
                  {label}
                </button>
              ))}
            </div>
          </FLabel>

          <FLabel label="Description" span2>
            <Txt
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Short event description visible on the event card…"
              disabled={isLoading}
            />
          </FLabel>

          <FLabel label="Event Image" span2>
            <div className="space-y-3">
              {imagePreview ? (
                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={isLoading}
                    className="absolute top-2 right-2 p-1 bg-red-500/90 hover:bg-red-600 rounded-lg text-white transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="w-full p-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors">
                  <Upload size={24} className="text-slate-400 mb-2" />
                  <span className="text-sm font-semibold text-slate-600">
                    Click to upload image
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    PNG, JPG, GIF up to 5MB
                  </span>
                  <input
                    type="file"
                    onChange={handleImageChange}
                    accept="image/*"
                    disabled={isLoading}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </FLabel>
        </div>

        <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100">
          <button
            onClick={() => valid && onSave(form)}
            disabled={!valid || isLoading}
            className={`flex-1 py-3 rounded-xl border-none font-['Outfit',_sans-serif] text-sm font-bold flex items-center justify-center gap-2 transition-all
                            ${valid && !isLoading ? "bg-gradient-to-br from-blue-500 to-blue-900 text-white cursor-pointer shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5" : "bg-slate-200 text-slate-400 cursor-not-allowed"}
                            ${isLoading ? "opacity-70" : ""}`}
          >
            <CheckCircle size={15} />{" "}
            {isLoading ? "Saving..." : isEdit ? "Save Changes" : "Create Event"}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`px-6 py-3 rounded-xl border border-slate-200 bg-slate-50 text-gray-400 font-['Outfit',_sans-serif] text-sm font-semibold transition-all
                            ${isLoading ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-slate-100 hover:text-gray-600"}`}
          >
            Cancel
          </button>
        </div>
        {!valid && (
          <p className="text-amber-500 text-xs mt-2 font-['Outfit',_sans-serif]">
            ⚠ Title, Date, and Venue are required.
          </p>
        )}
      </div>
    </Overlay>
  );
};
