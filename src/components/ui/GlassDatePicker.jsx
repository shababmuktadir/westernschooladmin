import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// বর্তমান বছর থেকে পেছনের ৫০ বছর এবং সামনের ২০ বছর
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 50; i <= currentYear + 20; i++) {
    years.push(i);
  }
  return years;
};

export default function GlassDatePicker({ label, value, onChange, placeholder = "Select a date" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date());
  
  // Views: 'date', 'month', 'year'
  const [view, setView] = useState("date"); 
  
  const containerRef = useRef(null);
  const years = generateYears();

  // বাইরে ক্লিক করলে ক্যালেন্ডার বন্ধ হওয়ার লজিক
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // --- Handlers ---
  const handleDateSelect = (e, day) => {
    e.preventDefault();
    const newDate = new Date(currentYear, currentMonth, day + 1);
    onChange(newDate.toISOString().split("T")[0]);
    setIsOpen(false); // সিলেক্ট করার পর বন্ধ হয়ে যাবে
  };

  const handleMonthSelect = (e, monthIndex) => {
    e.preventDefault();
    setCurrentDate(new Date(currentYear, monthIndex, 1));
    setView("date");
  };

  const handleYearSelect = (e, year) => {
    e.preventDefault();
    setCurrentDate(new Date(year, currentMonth, 1));
    setView("month");
  };

  const nextMonth = (e) => {
    e.preventDefault();
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  const prevMonth = (e) => {
    e.preventDefault();
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  // --- Render Helpers ---
  const formattedValue = value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "";

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
      
      {/* --- Glassmorphism Input Field --- */}
      <button 
        type="button"
        onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
        className="w-full flex items-center justify-between px-4 py-2.5 cursor-pointer rounded-xl 
                   bg-white dark:bg-slate-900/60 backdrop-blur-md 
                   border border-slate-300 dark:border-slate-700/80 
                   shadow-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                   transition-all hover:bg-slate-50 dark:hover:bg-slate-800/80"
      >
        <span className={`text-sm font-medium ${value ? "text-slate-800 dark:text-white" : "text-slate-400"}`}>
          {formattedValue || placeholder}
        </span>
        <CalendarDays className="w-4 h-4 text-blue-500" />
      </button>

      {/* --- Glassmorphism Calendar Dropdown --- */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-2 w-[280px] p-4 rounded-2xl
                        bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-2xl 
                        border border-slate-200 dark:border-slate-700 
                        shadow-2xl animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>
            
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); setView(view === "month" ? "date" : "month"); }} 
                className="text-sm font-bold text-slate-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {MONTHS[currentMonth]}
              </button>
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); setView(view === "year" ? "date" : "year"); }} 
                className="text-sm font-bold text-slate-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {currentYear}
              </button>
            </div>

            <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>
          </div>

          {/* --- DATE VIEW --- */}
          {view === "date" && (
            <>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map(day => (
                  <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {[...Array(firstDayOfMonth)].map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {[...Array(daysInMonth)].map((_, i) => {
                  const isSelected = value && new Date(value).getDate() === i + 1 && new Date(value).getMonth() === currentMonth && new Date(value).getFullYear() === currentYear;
                  const isToday = new Date().getDate() === i + 1 && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => handleDateSelect(e, i)}
                      className={`h-8 w-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all duration-200
                        ${isSelected 
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/40" 
                          : isToday 
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800" 
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* --- MONTH VIEW --- */}
          {view === "month" && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {MONTHS.map((month, idx) => (
                <button
                  key={month}
                  type="button"
                  onClick={(e) => handleMonthSelect(e, idx)}
                  className={`py-2 rounded-xl text-sm font-semibold transition-colors
                    ${currentMonth === idx 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/40" 
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                >
                  {month}
                </button>
              ))}
            </div>
          )}

          {/* --- YEAR VIEW --- */}
          {view === "year" && (
            <div className="grid grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={(e) => handleYearSelect(e, year)}
                  className={`py-2 rounded-xl text-sm font-semibold transition-colors
                    ${currentYear === year 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/40" 
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}