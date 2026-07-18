import React, { useState, useRef, useEffect, forwardRef } from "react";
import { ChevronDown, Check } from "lucide-react";

const Select = forwardRef(({ 
  label, 
  error, 
  options = [], 
  value,
  onChange,
  className = "", 
  fullWidth = true,
  placeholder = "Select an option...",
  id,
  disabled = false,
  leftIcon,
  ...props 
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  // ফাইন্ড সিলেক্টেড অপশন
  const selectedOption = options.find(opt => opt.value === value);

  // বাইরে ক্লিক করলে ড্রপডাউন বন্ধ করার লজিক
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // অপশন সিলেক্ট করার ফাংশন (নেটিভ ইভেন্টের মতো ডাটা পাঠাবে যাতে অন্য কোড ব্রেক না হয়)
  const handleSelect = (val) => {
    if (onChange) {
      onChange({ target: { name: props.name, value: val } });
    }
    setIsOpen(false);
  };

  return (
    <div className={`${fullWidth ? "w-full" : "w-auto"} ${className}`} ref={dropdownRef}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}

        {/* কাস্টম ট্রিগার বাটন */}
        <button
          type="button"
          id={selectId}
          ref={ref}
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center justify-between w-full rounded-lg border py-2.5 text-sm transition-colors text-left
            bg-white border-slate-300 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            dark:bg-slate-900 dark:border-slate-700 dark:text-white
            disabled:cursor-not-allowed disabled:opacity-50 dark:disabled:bg-slate-800
            ${leftIcon ? "pl-10 pr-3" : "px-3"}
            ${error ? "border-red-500 focus:ring-red-500" : ""}
            ${!selectedOption && !value ? "text-slate-500 dark:text-slate-400" : "text-slate-900 dark:text-white"}
          `}
          {...props}
        >
          <span className="block truncate font-medium">
            {selectedOption ? selectedOption.label : (value || placeholder)}
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ml-2 shrink-0 ${isOpen ? "rotate-180 text-blue-500" : ""}`} />
        </button>

        {/* কাস্টম পপআপ অপশন লিস্ট */}
        {isOpen && (
          <div className="absolute z-50 mt-2 w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl max-h-64 overflow-y-auto custom-scrollbar py-1.5 animate-in slide-in-from-top-2 fade-in duration-200">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-center text-slate-500 dark:text-slate-400">কোনো অপশন নেই</div>
            ) : (
              options.map((opt, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    relative cursor-pointer select-none py-2.5 pl-10 pr-4 text-sm transition-colors flex items-center
                    ${value === opt.value 
                      ? "bg-blue-50/50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-semibold" 
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    }
                  `}
                >
                  <span className="block truncate">{opt.label}</span>
                  {value === opt.value && (
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
});

Select.displayName = "Select";
export default Select;