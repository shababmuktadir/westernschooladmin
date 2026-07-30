import React, { useState, useRef, useEffect } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

export default function MonthPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Parse YYYY-MM
  const selectedYear = value ? parseInt(value.split("-")[0]) : new Date().getFullYear();
  const selectedMonth = value ? parseInt(value.split("-")[1]) - 1 : new Date().getMonth();

  const [viewYear, setViewYear] = useState(selectedYear);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMonthSelect = (index) => {
    const newMonth = String(index + 1).padStart(2, "0");
    onChange(`${viewYear}-${newMonth}`);
    setIsOpen(false);
  };

  const setThisMonth = () => {
    const now = new Date();
    onChange(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    setViewYear(now.getFullYear());
    setIsOpen(false);
  };

  const displayValue = value ? new Date(value + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Select Month";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input / Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-2.5 w-full md:w-48 border border-slate-300 dark:border-blue-500/50 rounded-xl bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-all shadow-sm"
      >
        <span className="font-medium text-sm ml-2">{displayValue}</span>
        <CalendarDays className="h-4 w-4 text-slate-400" />
      </div>

      {/* Dropdown Calendar */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-2 left-0 w-64 bg-white dark:bg-[#1a2235] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-4 animate-in fade-in zoom-in-95">
          
          {/* Header (Year Selector) */}
          <div className="flex justify-between items-center mb-4 bg-slate-50 dark:bg-[#1e293b] p-2 rounded-lg">
            <button onClick={() => setViewYear(viewYear - 1)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
            <span className="font-bold text-slate-800 dark:text-white">{viewYear}</span>
            <button onClick={() => setViewYear(viewYear + 1)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          {/* Months Grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {months.map((m, i) => {
              const isSelected = selectedYear === viewYear && selectedMonth === i;
              return (
                <button
                  key={m}
                  onClick={() => handleMonthSelect(i)}
                  className={`py-2 text-sm rounded-lg font-medium transition-colors ${
                    isSelected 
                      ? "bg-blue-600 text-white shadow-md" 
                      : "text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-700/50">
            <button 
              onClick={() => { onChange(""); setIsOpen(false); }} 
              className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
            <button 
              onClick={setThisMonth} 
              className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              This month
            </button>
          </div>
        </div>
      )}
    </div>
  );
}