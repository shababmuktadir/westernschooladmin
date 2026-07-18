import React, { forwardRef } from "react";
import { Check } from "lucide-react";

const Checkbox = forwardRef(({ 
  label, 
  description, 
  error, 
  className = "", 
  id,
  ...props 
}, ref) => {
  const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(36).substr(2, 9);

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="relative flex items-center justify-center mt-1">
        <input
          type="checkbox"
          id={checkboxId}
          ref={ref}
          className="peer sr-only"
          {...props}
        />
        <div className="w-5 h-5 border-2 rounded border-slate-300 bg-white dark:bg-slate-900 dark:border-slate-600 peer-checked:bg-blue-600 peer-checked:border-blue-600 dark:peer-checked:bg-blue-600 dark:peer-checked:border-blue-600 transition-all flex items-center justify-center cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
          <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
        </div>
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label 
              htmlFor={checkboxId} 
              className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {description}
            </p>
          )}
          {error && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>
          )}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = "Checkbox";
export default Checkbox;