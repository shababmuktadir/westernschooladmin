import React, { useState, useRef, useEffect, forwardRef } from "react";
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  isSameMonth, isSameDay, addDays, parseISO, isValid, setMonth, setYear, getMonth, getYear 
} from "date-fns";
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

  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  let parsedDate = null;
  if (value) {
    const parsed = typeof value === 'string' ? parseISO(value) : new Date(value);
    if (isValid(parsed)) parsedDate = parsed;
  }

  const [currentMonth, setCurrentMonth] = useState(parsedDate || new Date());

  useEffect(() => {
    if (isOpen && parsedDate) setCurrentMonth(parsedDate);
  }, [isOpen, parsedDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowYearPicker(false);
        setShowMonthPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateClick = (day) => {
    const formattedDate = format(day, 'yyyy-MM-dd'); 
    setCurrentMonth(day);
    if (onChange) onChange(formattedDate);
    setIsOpen(false);
    setShowYearPicker(false);
    setShowMonthPicker(false);
  };

  const renderHeader = () => {
    const monthsList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentYearVal = new Date().getFullYear();
    const years = Array.from({ length: 61 }, (_, i) => currentYearVal - 30 + i);

    return (
      <div className="flex justify-between items-center mb-4 relative z-50 px-2">
        <button 
          type="button" 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentMonth(subMonths(currentMonth, 1)); setShowYearPicker(false); setShowMonthPicker(false); }} 
          className="p-1.5 rounded-lg border border-slate-600/50 hover:border-slate-500 text-slate-300 transition-colors outline-none"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="flex items-center gap-2">
          {/* Month Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMonthPicker(!showMonthPicker); setShowYearPicker(false); }}
              className="text-base font-bold text-white hover:text-blue-400 transition-colors"
            >
              {format(currentMonth, 'MMMM')}
            </button>
            {showMonthPicker && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl z-50 p-2 grid grid-cols-1 gap-1 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in">
                {monthsList.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentMonth(setMonth(currentMonth, i)); setShowMonthPicker(false); }}
                    className={`text-sm text-left px-3 py-1.5 rounded-lg transition-colors ${getMonth(currentMonth) === i ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Year Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowYearPicker(!showYearPicker); setShowMonthPicker(false); }}
              className="text-base font-bold text-white hover:text-blue-400 transition-colors"
            >
              {format(currentMonth, 'yyyy')}
            </button>
            {showYearPicker && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-24 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl z-50 p-2 flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in">
                {years.map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentMonth(setYear(currentMonth, y)); setShowYearPicker(false); }}
                    className={`text-sm text-center px-2 py-1.5 rounded-lg transition-colors ${getYear(currentMonth) === y ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button 
          type="button" 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentMonth(addMonths(currentMonth, 1)); setShowYearPicker(false); setShowMonthPicker(false); }} 
          className="p-1.5 rounded-lg text-slate-300 hover:text-white transition-colors outline-none"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center text-[10px] font-bold text-slate-400 py-2 uppercase tracking-widest">
          {format(addDays(startDate, i), 'EEE')}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-1">{days}</div>;
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
          <div key={day} className="flex justify-center py-1">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDateClick(cloneDay); }}
              className={`
                w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all outline-none
                ${!isCurrentMonth ? "text-slate-600 hover:text-slate-400" : ""}
                ${isCurrentMonth && !isSelected && !isToday ? "text-slate-200 hover:bg-slate-700/50" : ""}
                ${isCurrentMonth && isToday && !isSelected ? "text-blue-400 font-bold" : ""}
                ${isSelected ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : ""}
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
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}

      <input type="text" id={inputId} ref={ref} value={value || ''} onChange={() => {}} className="hidden" {...props} />

      <button
        type="button"
        onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); setShowYearPicker(false); setShowMonthPicker(false); }}
        className={`flex items-center justify-between w-full rounded-xl border px-4 py-2.5 text-sm transition-all outline-none bg-white dark:bg-[#0f172a] ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'}`}
      >
        <span className={parsedDate ? "text-slate-900 dark:text-slate-100 font-medium" : "text-slate-400 dark:text-slate-500"}>
          {parsedDate ? format(parsedDate, 'dd/MM/yyyy') : placeholder}
        </span>
        <CalendarIcon className={`w-4 h-4 transition-colors ${isOpen ? "text-blue-500" : "text-slate-500 dark:text-slate-400"}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 w-[300px] bg-[#1a2235] border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/60 animate-in fade-in zoom-in-95 duration-200">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
          
          <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center px-2">
            <button 
              type="button" 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onChange) onChange(""); setIsOpen(false); }} 
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Clear
            </button>
            <button 
              type="button" 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDateClick(new Date()); }} 
              className="text-sm font-bold text-blue-500 hover:text-blue-400 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

DatePicker.displayName = "DatePicker";
export default DatePicker;