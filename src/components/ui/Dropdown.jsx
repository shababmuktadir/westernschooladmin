import React, { useState, useRef, useEffect, forwardRef } from "react";
import { ChevronDown, Check } from "lucide-react";

const Dropdown = forwardRef(({
  label,
  options = [],
  value,
  onChange,
  error,
  placeholder = "Select an option...",
  className = "",
  fullWidth = true,
  id,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    if (onChange) onChange(optionValue);
    setIsOpen(false);
  };

  const formattedOptions = options?.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  ) || [];

  const selectedOption = formattedOptions.find(opt => String(opt.value) === String(value));

  return (
    <div className={`${fullWidth ? "w-full" : "w-auto"} ${className}`} ref={dropdownRef}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label} {props.required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          id={inputId}
          ref={ref}
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center justify-between w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-200
            bg-white dark:bg-[#0f172a] outline-none
            ${isOpen 
              ? 'border-blue-500 ring-2 ring-blue-500/50' 
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
            }
            ${error ? 'border-red-500 ring-red-500/50 dark:border-red-500' : ''}
            text-slate-900 dark:text-slate-100
          `}
          {...props}
        >
          <span className={`block truncate ${!selectedOption ? 'text-slate-400 dark:text-slate-500' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 ml-2 shrink-0 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <ul className="max-h-60 overflow-auto py-1.5 focus:outline-none custom-scrollbar">
              {formattedOptions.length === 0 ? (
                <li className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">
                  No options found
                </li>
              ) : (
                formattedOptions.map((option, index) => (
                  <li
                    key={index}
                    onClick={() => handleSelect(option.value)}
                    className={`
                      relative flex items-center px-4 py-2.5 text-sm cursor-pointer transition-colors
                      ${String(value) === String(option.value)
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                      }
                    `}
                  >
                    <span className="block truncate flex-1">{option.label}</span>
                    {String(value) === String(option.value) && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 ml-2 shrink-0" />
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-red-500 dark:text-red-400 flex items-center gap-1.5 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});

Dropdown.displayName = "Dropdown";
export default Dropdown;