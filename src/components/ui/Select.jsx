import React, { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

const Select = forwardRef(({ 
  label, 
  error, 
  options = [], 
  className = "", 
  fullWidth = true,
  placeholder = "Select an option",
  id,
  ...props 
}, ref) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`${fullWidth ? "w-full" : "w-auto"} ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          className={`
            appearance-none block w-full rounded-lg border px-3 py-2 text-sm transition-colors
            bg-white text-slate-900 border-slate-300 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            dark:bg-slate-900 dark:border-slate-700 dark:text-white
            dark:focus:ring-blue-500 dark:focus:border-blue-500
            disabled:cursor-not-allowed disabled:opacity-50 dark:disabled:bg-slate-800
            ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500" : ""}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="dark:bg-slate-800 text-slate-500">
              {placeholder}
            </option>
          )}
          {options.map((opt, idx) => (
            <option key={idx} value={opt.value} className="dark:bg-slate-800">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
});

Select.displayName = "Select";
export default Select;