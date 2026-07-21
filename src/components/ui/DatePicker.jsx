import React, { useState, useRef, useEffect, forwardRef } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO, isValid } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

const DatePicker = forwardRef(({ 
  label, 
  error, 
  value,
  onChange,
  className = "", 
  fullWidth = true,
  id,
  placeholder = "Select Date",
  ...props 
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(36).substr(2, 9);

  // ইনপুট ভ্যালুটিকে সঠিকভাবে ডেটে কনভার্ট করা
  let parsedDate = null;
  if (value) {
    const parsed = typeof value === 'string' ? parseISO(value) : new Date(value);
    if (isValid(parsed)) parsedDate = parsed;
  }

  const [currentMonth, setCurrentMonth] = useState(parsedDate || new Date());

  // পপআপ ওপেন হলে বর্তমান সিলেক্টেড মাস দেখাবে
  useEffect(() => {
    if (isOpen && parsedDate) {
      setCurrentMonth(parsedDate);
    }
  }, [isOpen, parsedDate]);

  // বাইরে ক্লিক করলে পপআপ বন্ধ হবে
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateClick = (day) => {
    const formattedDate = format(day, 'yyyy-MM-dd'); // এক্সিস্টিং ফর্মের সাথে ম্যাচ করার জন্য
    if (onChange) {
      onChange(formattedDate);
    }
    setIsOpen(false);
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <button 
          type="button" 
          onClick={(e) => { e.stopPropagation(); setCurrentMonth(subMonths(currentMonth, 1)); }} 
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold text-slate-800 dark:text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button 
          type="button" 
          onClick={(e) => { e.stopPropagation(); setCurrentMonth(addMonths(currentMonth, 1)); }} 
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 py-1 uppercase tracking-wider">
          {format(addDays(startDate, i), 'EEE')}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        const isSelected = parsedDate && isSameDay(day, parsedDate);
        const isToday = isSameDay(day, new Date());
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div key={day} onClick={(e) => { e.stopPropagation(); handleDateClick(cloneDay); }} className="flex justify-center py-0.5">
            <button
              type="button"
              className={`
                w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 outline-none
                ${!isCurrentMonth ? "text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800" : ""}
                ${isCurrentMonth && !isSelected && !isToday ? "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700" : ""}
                ${isCurrentMonth && isToday && !isSelected ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : ""}
                ${isSelected ? "bg-blue-600 text-white shadow-md shadow-blue-500/30" : ""}
              `}
            >
              {formattedDate}
            </button>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7" key={day}>{days}</div>);
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className={`${fullWidth ? "w-full" : "w-auto"} ${className} relative`} ref={dropdownRef}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label} {props.required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Hidden input to maintain compatibility with existing forms / React Hook Form */}
      <input
        type="text"
        id={inputId}
        ref={ref}
        value={value || ''}
        onChange={() => {}} // Handled by custom UI
        className="hidden"
        {...props}
      />

      {/* Custom Input Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 cursor-pointer outline-none
          bg-white dark:bg-[#0f172a]
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'}
          ${error ? 'border-red-500 ring-red-500/50 dark:border-red-500' : ''}
        `}
      >
        <span className={parsedDate ? "text-slate-900 dark:text-slate-100 font-medium" : "text-slate-400 dark:text-slate-500"}>
          {parsedDate ? format(parsedDate, 'MM/dd/yyyy') : placeholder}
        </span>
        <CalendarIcon className={`w-4 h-4 transition-colors ${isOpen ? "text-blue-500" : "text-slate-500 dark:text-slate-400"}`} />
      </div>

      {/* Custom Calendar Dropdown Popup */}
      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 animate-in fade-in zoom-in-95 duration-200">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
          
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); onChange && onChange(""); setIsOpen(false); }} 
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Clear
            </button>
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); handleDateClick(new Date()); }} 
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1.5 text-sm text-red-500 dark:text-red-400 flex items-center gap-1.5 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});

DatePicker.displayName = "DatePicker";
export default DatePicker;