import React, { forwardRef } from "react";

const DatePicker = forwardRef(({ 
  label, 
  error, 
  value,
  onChange,
  className = "", 
  fullWidth = true,
  id,
  ...props 
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(36).substr(2, 9);

  // কাস্টম হ্যান্ডলার যাতে এটি সরাসরি ভ্যালু রিটার্ন করে (যেমনটি FeeEntry তে ব্যবহার করা হয়েছে)
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className={`${fullWidth ? "w-full" : "w-auto"} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        type="date"
        id={inputId}
        ref={ref}
        value={value}
        onChange={handleChange}
        className={`
          block w-full rounded-lg border px-3 py-2 text-sm transition-colors
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

DatePicker.displayName = "DatePicker";
export default DatePicker;