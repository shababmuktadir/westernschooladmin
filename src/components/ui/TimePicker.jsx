import { Clock } from "lucide-react";

export default function TimePicker({ value, onChange }) {
  return (
    <div className="relative w-full">
      <div className="flex items-center w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden transition-colors">
        <div className="pl-3 pr-2 py-2 text-slate-400">
          <Clock className="w-4 h-4" />
        </div>
        <input
          type="time"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full py-2 pr-4 bg-transparent text-sm text-slate-900 dark:text-slate-100 outline-none"
          // ডিফল্ট ব্রাউজার স্টাইল হাইড করা
          style={{ 
             WebkitAppearance: 'none', 
             MozAppearance: 'textfield' 
          }}
        />
      </div>
    </div>
  );
}