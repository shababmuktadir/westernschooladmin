import React, { useState, useEffect, useRef } from "react";

export function Dropdown({ children, className = "" }) {
  return (
    <div className={`relative inline-block text-left ${className}`}>
      {children}
    </div>
  );
}

export function DropdownTrigger({ children, isOpen, setIsOpen }) {
  return (
    <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer inline-block">
      {children}
    </div>
  );
}

export function DropdownMenu({ children, isOpen, setIsOpen, align = "right", className = "" }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  const alignmentClass = align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left";

  return (
    <div
      ref={menuRef}
      className={`absolute z-50 mt-2 w-56 rounded-lg bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none animate-in fade-in zoom-in-95 duration-100 ${alignmentClass} ${className}`}
    >
      <div className="py-1" role="menu" aria-orientation="vertical">
        {children}
      </div>
    </div>
  );
}

export function DropdownItem({ children, onClick, icon, danger = false, className = "" }) {
  const baseStyle = "flex items-center w-full px-4 py-2 text-sm text-left transition-colors cursor-pointer";
  const colorStyle = danger 
    ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" 
    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white";

  return (
    <div
      onClick={onClick}
      role="menuitem"
      className={`${baseStyle} ${colorStyle} ${className}`}
    >
      {icon && <span className="mr-2 h-4 w-4">{icon}</span>}
      {children}
    </div>
  );
}