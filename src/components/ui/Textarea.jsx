import React, { forwardRef } from "react";

const Textarea = forwardRef(({ 
  label, 
  error, 
  className = "", 
  fullWidth = true,
  id,
  rows = 3,
  ...props 
}, ref) => {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`${fullWidth ? "w-full" : "w-auto"} ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        ref={ref}
        rows={rows}
        className={`
          block w-full rounded-lg border px-3 py-2 text-sm transition-colors custom-scrollbar resize-y
          bg-white text-slate-900 border-slate-300 placeholder:text-slate-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500
          dark:focus:ring-blue-500 dark:focus:border-blue-500
          disabled:cursor-not-allowed disabled:opacity-50 dark:disabled:bg-slate-800
          ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500" : ""}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = "Textarea";
export default Textarea;