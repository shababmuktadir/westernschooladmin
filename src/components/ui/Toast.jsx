import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, XCircle, X } from "lucide-react";

export default function Toast({ message, type = "info", duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for fade-out animation
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  const styles = {
    success: { icon: CheckCircle2, bg: "bg-emerald-50 dark:bg-emerald-900/30", border: "border-emerald-200 dark:border-emerald-800/50", text: "text-emerald-800 dark:text-emerald-400", iconColor: "text-emerald-500" },
    error: { icon: XCircle, bg: "bg-red-50 dark:bg-red-900/30", border: "border-red-200 dark:border-red-800/50", text: "text-red-800 dark:text-red-400", iconColor: "text-red-500" },
    warning: { icon: AlertCircle, bg: "bg-amber-50 dark:bg-amber-900/30", border: "border-amber-200 dark:border-amber-800/50", text: "text-amber-800 dark:text-amber-400", iconColor: "text-amber-500" },
    info: { icon: Info, bg: "bg-blue-50 dark:bg-blue-900/30", border: "border-blue-200 dark:border-blue-800/50", text: "text-blue-800 dark:text-blue-400", iconColor: "text-blue-500" }
  };

  const { icon: Icon, bg, border, text, iconColor } = styles[type];

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center w-full max-w-xs p-4 space-x-3 rounded-lg border shadow-lg animate-in slide-in-from-right-5 fade-in duration-300 ${bg} ${border}`}>
      <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
      <div className={`text-sm font-medium flex-1 ${text}`}>
        {message}
      </div>
      <button 
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className={`shrink-0 p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity ${text}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}