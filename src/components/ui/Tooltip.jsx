import React from "react";

export default function Tooltip({ children, content, position = "top", className = "" }) {
  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowPositions = {
    top: "top-full left-1/2 -translate-x-1/2 -mt-1 border-t-slate-800 dark:border-t-slate-200 border-l-transparent border-r-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-slate-800 dark:border-b-slate-200 border-l-transparent border-r-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 -ml-1 border-l-slate-800 dark:border-l-slate-200 border-t-transparent border-b-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 -mr-1 border-r-slate-800 dark:border-r-slate-200 border-t-transparent border-b-transparent border-l-transparent",
  };

  return (
    <div className={`relative flex items-center group ${className}`}>
      {children}
      <div className={`absolute z-50 whitespace-nowrap rounded-md bg-slate-800 dark:bg-slate-200 px-2 py-1 text-xs text-white dark:text-slate-900 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none ${positions[position]}`}>
        {content}
        {/* Tooltip Arrow */}
        <div className={`absolute border-[4px] ${arrowPositions[position]}`} />
      </div>
    </div>
  );
}