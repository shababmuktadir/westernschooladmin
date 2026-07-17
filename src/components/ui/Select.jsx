import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function Select({ options, value, onChange, placeholder = "Select option", error }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center px-4 py-2 bg-white dark:bg-slate-800 border ${error ? "border-red-500" : "border-slate-300 dark:border-slate-700"} rounded-lg text-sm text-left focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none`}
      >
        <span className={value ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => { onChange(opt); setIsOpen(false); }}
              className="px-4 py-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-200 flex justify-between items-center"
            >
              {opt}
              {value === opt && <Check className="w-4 h-4 text-blue-600" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}