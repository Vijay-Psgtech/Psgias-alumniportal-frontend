import React from "react";
import { motion } from "framer-motion";
import { X, Trash2 } from "lucide-react";

export const Overlay = ({ onClose, children, wide }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-[#0c0e1a]/60 flex items-center justify-center z-[1000] p-5 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.93, opacity: 0, y: 12 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.93, opacity: 0 }}
      className={`bg-white rounded-2xl w-full max-h-[93vh] overflow-y-auto shadow-[0_32px_80px_rgba(12,14,26,0.25)] relative ${wide ? "max-w-[780px]" : "max-w-[520px]"}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  </motion.div>
);

export const FLabel = ({ label, children, span2 }) => (
  <div
    className={`flex flex-col gap-1.5 ${span2 ? "col-span-1 sm:col-span-2" : ""}`}
  >
    <label className="text-[10px] font-bold text-gray-400 tracking-[1.2px] font-['Outfit',_sans-serif] uppercase">
      {label}
    </label>
    {children}
  </div>
);

const inpClass =
  "px-3.5 py-2.5 border border-slate-200 rounded-xl font-['Outfit',_sans-serif] text-sm text-[#0c0e1a] outline-none w-full bg-[#fafbfd] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all";

export const Inp = (props) => (
  <input {...props} className={`${inpClass} ${props.className || ""}`} />
);

export const Sel = ({ children, ...props }) => (
  <select {...props} className={`${inpClass} ${props.className || ""}`}>
    {children}
  </select>
);

export const Txt = (props) => (
  <textarea
    {...props}
    className={`${inpClass} resize-y min-h-[82px] ${props.className || ""}`}
  />
);

export const ModalHeader = ({ title, sub, onClose }) => (
  <div className="px-7 pt-6 pb-5 border-b border-slate-100 flex justify-between items-start">
    <div>
      <div className="text-[10px] text-blue-500 font-bold tracking-[1.5px] font-['Outfit',_sans-serif] mb-1 uppercase">
        {sub}
      </div>
      <h2 className="font-['Playfair_Display',_serif] text-[21px] font-extrabold text-[#0c0e1a]">
        {title}
      </h2>
    </div>
    <button
      onClick={onClose}
      className="bg-slate-100 hover:bg-slate-200 transition-colors border-none rounded-xl w-8 h-8 cursor-pointer flex items-center justify-center shrink-0"
    >
      <X size={15} className="text-gray-500" />
    </button>
  </div>
);

export const DeleteModal = ({ label, onConfirm, onClose, isLoading }) => (
  <Overlay onClose={onClose}>
    <div className="px-8 py-10 text-center">
      <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Trash2 size={22} className="text-red-600" />
      </div>
      <h2 className="font-['Playfair_Display',_serif] text-[19px] text-[#0c0e1a] mb-2.5 font-bold">
        Confirm Delete
      </h2>
      <p className="text-gray-500 text-sm mb-7 font-['Outfit',_sans-serif] leading-relaxed">
        Delete <strong>"{label}"</strong>?<br />
        This action cannot be undone.
      </p>
      <div className="flex gap-2.5 justify-center">
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`px-7 py-2.5 rounded-xl border-none font-['Outfit',_sans-serif] text-sm font-bold transition-all ${isLoading ? "bg-red-200 text-white cursor-not-allowed opacity-60" : "bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-lg shadow-red-600/20"}`}
        >
          {isLoading ? "Deleting..." : "Delete"}
        </button>
        <button
          onClick={onClose}
          disabled={isLoading}
          className={`px-7 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-gray-400 font-['Outfit',_sans-serif] text-sm font-semibold transition-all ${isLoading ? "cursor-not-allowed" : "hover:bg-slate-100 hover:text-gray-600 cursor-pointer"}`}
        >
          Cancel
        </button>
      </div>
    </div>
  </Overlay>
);
