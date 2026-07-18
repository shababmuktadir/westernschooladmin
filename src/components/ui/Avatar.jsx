import React, { useState } from "react";
import { User } from "lucide-react";

export default function Avatar({ src, alt, fallback, size = "md", className = "" }) {
  const [imgError, setImgError] = useState(false);

  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-lg"
  };

  const baseClasses = `relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase ring-2 ring-white dark:ring-slate-900 ${sizes[size]} ${className}`;

  if (src && !imgError) {
    return (
      <div className={baseClasses}>
        <img 
          src={src} 
          alt={alt || "Avatar"} 
          onError={() => setImgError(true)}
          className="aspect-square h-full w-full object-cover" 
        />
      </div>
    );
  }

  return (
    <div className={baseClasses}>
      {fallback ? fallback.substring(0, 2) : <User className="h-1/2 w-1/2 opacity-50" />}
    </div>
  );
}