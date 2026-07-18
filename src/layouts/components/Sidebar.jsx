import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Settings, UserPlus, Sun, Moon, Circle } from "lucide-react";
import { SIDEBAR_MENU } from "@/constants/sidebar";
import { appConfig } from "@/config/appConfig";
import Avatar from "@/components/ui/Avatar"; 

const CUSTOM_LOGO_URL = "https://res.cloudinary.com/do1dejkkk/image/upload/v1778605133/western_logo_hg9fji_1_vojrqz_1_zjiw5m.png";

// হেল্পার ফাংশন: ড্রপডাউনের ভেতরের সব লিংকে একসাথে বের করে আনা
const getLeafItems = (item) => {
  let leaves = [];
  if (item.path) {
    leaves.push(item);
  }
  if (item.subItems && item.subItems.length > 0) {
    item.subItems.forEach(sub => {
      leaves = leaves.concat(getLeafItems(sub));
    });
  }
  return leaves;
};

// ফ্ল্যাট মেনু আইটেম কম্পোনেন্ট (নো ড্রপডাউন, নো ব্যাকগ্রাউন্ড হোভার)
const FlatMenuItem = ({ item }) => {
  const Icon = item.icon || Circle; 

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `relative flex items-center gap-4 w-full py-2.5 px-6 text-sm transition-all group font-sans tracking-wide
        ${isActive 
          ? "text-purple-600 dark:text-blue-400 font-semibold" 
          : "text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-blue-400"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Active Left Indicator Bar */}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-purple-600 dark:bg-blue-400 rounded-r-md shadow-[2px_0_8px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_8px_rgba(96,165,250,0.3)]"></div>
          )}
          
          <Icon 
            className={`w-4 h-4 transition-colors shrink-0 ${
              isActive ? "text-purple-600 dark:text-blue-400" : "text-slate-400 group-hover:text-purple-600 dark:group-hover:text-blue-400"
            }`} 
            strokeWidth={isActive ? 2.5 : 1.75} 
          />
          <span className="truncate text-left">{item.title}</span>
        </>
      )}
    </NavLink>
  );
};


export default function Sidebar({ isOpen = true }) {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsRef = useRef(null);
  const navigate = useNavigate();

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  const user = {
    displayName: "Admin User", 
    email: "admin@westernschool.edu.bd",
    photoURL: null
  }; 

  const handleLogout = () => {
    alert("লগআউট করা হয়েছে!");
  };

  const handleAddAdmin = () => {
    setShowSettingsMenu(false);
    navigate("/add-admin");
  };

  const handleThemeToggle = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }
  };

  // ক্লিক আউটসাইড
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 h-screen bg-white dark:bg-black border-r border-slate-200 dark:border-white/10 flex flex-col transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
      
      {/* 1. Logo & School Name */}
      <div className="h-[72px] flex items-center px-6 shrink-0 gap-3 mt-2">
        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-0.5">
          <img 
            src={CUSTOM_LOGO_URL} 
            alt="Logo" 
            className="w-full h-full object-contain rounded-full bg-white" 
          />
        </div>
        <div className="overflow-hidden flex-1">
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white truncate font-sans">
            {appConfig?.schoolName || "Western School"}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-sans">
            Management System
          </p>
        </div>
      </div>

      {/* 2. Flat Menu Navigation (No Dropdowns, Just Dividers) */}
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar flex flex-col gap-1">
        {SIDEBAR_MENU.map((item, index) => {
          
          const leaves = getLeafItems(item);
          
          // যদি সাব-মেনু না থাকে (যেমন- ড্যাশবোর্ড)
          if (!item.subItems || item.subItems.length === 0) {
            return <FlatMenuItem key={index} item={item} />;
          }

          // যদি সাব-মেনু থাকে, তবে ডিভাইডার দিয়ে রেন্ডার করবে
          return (
            <div key={index} className="mb-2">
              
              {/* Divider & Section Header */}
              <div className="px-6 mt-4 mb-3 flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
                  {item.title}
                </span>
                <div className="h-px bg-slate-200 dark:bg-white/10 flex-1"></div>
              </div>
              
              {/* All Nested Links rendered flat */}
              <div className="flex flex-col gap-0.5">
                {leaves.map((leaf, idx) => (
                  <FlatMenuItem key={`${index}-${idx}`} item={leaf} />
                ))}
              </div>

            </div>
          );
        })}
      </nav>
      
      {/* 3. Divider line */}
      <div className="px-6">
        <div className="w-full h-px bg-slate-200 dark:bg-white/10"></div>
      </div>
      
      {/* 4. Profile & Settings Section */}
      <div className="relative shrink-0 font-sans mt-2 mb-4 px-4" ref={settingsRef}>
        
        {/* Settings Popover */}
        {showSettingsMenu && (
          <div className="absolute bottom-full right-4 w-52 mb-2 animate-in fade-in zoom-in-95 duration-200 z-50">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden p-1.5">
              
              <div className="px-3 py-2 border-b border-slate-100 dark:border-white/10 mb-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Account</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate" title={user?.email}>{user?.email}</p>
              </div>

              {/* Dark Mode Toggle */}
              <button 
                onClick={handleThemeToggle}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-blue-400 transition-colors mb-1"
              >
                {isDarkMode ? <Sun className="w-4 h-4 mr-3 text-amber-500" /> : <Moon className="w-4 h-4 mr-3 text-slate-400" />} 
                {isDarkMode ? "লাইট মোড" : "ডার্ক মোড"}
              </button>

              <button 
                onClick={handleAddAdmin}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-blue-400 transition-colors mb-1"
              >
                <UserPlus className="w-4 h-4 mr-3" /> নতুন এডমিন
              </button>

              <div className="h-px bg-slate-100 dark:bg-white/5 my-1 mx-2"></div>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" /> লগআউট
              </button>

            </div>
          </div>
        )}

        {/* User Info Bar (No background hover) */}
        <div className="p-2 flex items-center gap-3">
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <Avatar 
              src={user?.photoURL} 
              fallback={user?.displayName || "Admin"} 
              size="sm" 
              className="shrink-0"
            />
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {user?.displayName || "Admin"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                Super Admin
              </p>
            </div>
          </div>

          <button 
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className={`p-2 rounded-lg transition-colors shrink-0 ${showSettingsMenu ? "text-purple-600 dark:text-blue-400" : "text-slate-400 hover:text-purple-600 dark:hover:text-blue-400"}`}
          >
            <Settings className={`w-4 h-4 transition-transform duration-300 ${showSettingsMenu ? "rotate-90" : ""}`} />
          </button>
        </div>

      </div>
    </aside>
  );
}