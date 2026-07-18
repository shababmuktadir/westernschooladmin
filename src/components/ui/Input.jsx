import React, { forwardRef } from "react";

const Input = forwardRef(({ 
  label, 
  error, 
  leftIcon, 
  rightIcon, 
  className = "", 
  fullWidth = true,
  id,
  ...props 
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`${fullWidth ? "w-full" : "w-auto"} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`
            block w-full rounded-lg border px-3 py-2 text-sm transition-colors
            bg-white text-slate-900 border-slate-300 placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500
            dark:focus:ring-blue-500 dark:focus:border-blue-500
            disabled:cursor-not-allowed disabled:opacity-50 dark:disabled:bg-slate-800
            ${leftIcon ? "pl-10" : ""} 
            ${rightIcon ? "pr-10" : ""}
            ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500" : ""}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";
export default Input;