import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import "react-day-picker/dist/style.css";

export default function DatePicker({ value, onChange, placeholder = "Pick a date", error }) {
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
        className={`w-full flex justify-between items-center px-4 py-2 bg-white dark:bg-slate-800 border ${error ? "border-red-500" : "border-slate-300 dark:border-slate-700"} rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none`}
      >
        <span className={value ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}>
          {value ? format(new Date(value), "PPP") : placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-2">
          <DayPicker
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={(date) => { if(date){ onChange(date.toISOString()); setIsOpen(false); } }}
            className="dark:text-slate-200"
          />
        </div>
      )}
    </div>
  );
}