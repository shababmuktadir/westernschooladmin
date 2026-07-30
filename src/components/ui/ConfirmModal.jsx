import React from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 dark:bg-slate-900/50 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      ></div>

      {/* Bottom Glassmorphism Modal Content */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-white/70 dark:bg-[#0f172a]/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 p-6 text-left shadow-2xl transition-all animate-in slide-in-from-bottom-12 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mt-2">
          <div className="flex-shrink-0 bg-red-100/80 dark:bg-red-500/20 p-3.5 rounded-2xl border border-red-200 dark:border-red-500/30 shadow-inner">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-8 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200/50 dark:border-slate-600/50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 rounded-xl transition-colors border border-red-500/50"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}