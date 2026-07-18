import React from "react";
import { FileQuestion } from "lucide-react";

export default function EmptyState({ 
  icon: Icon = FileQuestion, 
  title = "No data found", 
  description = "Get started by creating a new record.",
  actionButton,
  className = "" 
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 ${className}`}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
        <Icon className="h-8 w-8 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
        {description}
      </p>
      {actionButton && (
        <div>{actionButton}</div>
      )}
    </div>
  );
}