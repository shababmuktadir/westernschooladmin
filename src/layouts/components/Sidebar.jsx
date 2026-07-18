import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Settings, UserPlus, Sun, Moon, Circle, MoreHorizontal } from "lucide-react";
import { SIDEBAR_MENU } from "@/constants/sidebar";
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

// মেনু আইটেম কম্পোনেন্ট (ক্লিন এবং বড় ফন্ট ডিজাইন)
const FlatMenuItem = ({ item }) => {
  const Icon = item.icon || Circle; 

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center justify-between w-full py-2.5 px-3.5 mx-2 rounded-xl text-[15px] font-medium transition-colors font-sans
        ${isActive 
          ? "bg-slate-100 dark:bg-[#2A3143] text-slate-900 dark:text-white" 
          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#242A38] hover:text-slate-900 dark:hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-3.5 truncate">
            <Icon 
              className={`w-5 h-5 shrink-0 ${
                isActive 
                  ? "text-slate-900 dark:text-white" 
                  : "text-slate-500 dark:text-slate-400"
              }`} 
              strokeWidth={2} 
            />
            <span className="truncate">{item.title}</span>
          </div>
          
          {/* ব্যাজ সাপোর্ট (যদি item.badge থাকে) */}
          {item.badge && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-slate-100 dark:bg-[#343D52] text-slate-500 dark:text-slate-300 shrink-0">
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};


export default function Sidebar({ isOpen = true }) {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsRef = useRef(null);
  const navigate = useNavigate();

  // ডার্ক মোড স্টেট
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  // ইউজারের প্রোফাইলে আপনার দেওয়া লিংকটি যুক্ত করা হয়েছে
  const user = {
    displayName: "Shabab", 
    email: "@wsc_admin",
    photoURL: "https://res.cloudinary.com/do1dejkkk/image/upload/v1781464021/muktadir_shabab_o3tihe.jpg"
  }; 

  const handleLogout = () => {
    alert("লগআউট করা হয়েছে!");
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

  // বাইরে ক্লিক করলে পপআপ বন্ধ করার জন্য
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
    <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 h-screen bg-white dark:bg-[#1C212B] border-r border-slate-100 dark:border-white/5 flex flex-col transition-transform duration-300 shadow-xl lg:shadow-none ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
      
      {/* ১. লোগো এবং স্কুলের নাম (স্বচ্ছ ব্যাকগ্রাউন্ড এবং বড় সাইজ) */}
      <div className="flex items-center gap-3 px-6 pt-7 pb-5 shrink-0">
        <div className="w-12 h-12 flex items-center justify-center shrink-0 bg-transparent">
          <img 
            src={CUSTOM_LOGO_URL} 
            alt="WSC Logo" 
            className="w-full h-full object-contain drop-shadow-sm" 
          />
        </div>
        <h2 className="text-[19px] font-bold text-slate-900 dark:text-white uppercase tracking-wide font-sans">
          WSC
        </h2>
      </div>

      {/* ২. ফ্ল্যাট মেনু নেভিগেশন */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto custom-scrollbar flex flex-col gap-1">
        {SIDEBAR_MENU.map((item, index) => {
          
          const leaves = getLeafItems(item);
          
          // যদি সাব-মেনু না থাকে
          if (!item.subItems || item.subItems.length === 0) {
            return (
              <div key={index} className="mb-2">
                <FlatMenuItem item={item} />
              </div>
            );
          }

          // যদি সাব-মেনু থাকে, তবে সেকশন টাইটেল দিয়ে রেন্ডার করবে
          return (
            <div key={index} className="mb-4 mt-2">
              
              {/* সেকশন হেডার */}
              <div className="px-4 mb-3">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {item.title}
                </span>
              </div>
              
              {/* ভেতরের লিংকগুলো */}
              <div className="flex flex-col gap-1">
                {leaves.map((leaf, idx) => (
                  <FlatMenuItem key={`${index}-${idx}`} item={leaf} />
                ))}
              </div>

            </div>
          );
        })}
      </nav>
      
      {/* ৩. প্রোফাইল এবং সেটিংস সেকশন */}
      <div className="relative shrink-0 font-sans mt-2 mb-4 px-4" ref={settingsRef}>
        
        {/* পপওভার মেনু */}
        {showSettingsMenu && (
          <div className="absolute bottom-full right-4 w-56 mb-2 animate-in fade-in zoom-in-95 duration-200 z-50">
            <div className="bg-white dark:bg-[#2A3143] border border-slate-200 dark:border-white/5 rounded-2xl shadow-xl overflow-hidden p-1.5">
              
              <div className="flex flex-col gap-0.5">
                <button 
                  onClick={handleThemeToggle}
                  className="w-full flex items-center px-3 py-2 text-[14px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#343D52] rounded-xl transition-all"
                >
                  {isDarkMode ? <Sun className="w-4 h-4 mr-3" /> : <Moon className="w-4 h-4 mr-3" />} 
                  {isDarkMode ? "লাইট মোড" : "ডার্ক মোড"}
                </button>

                <button 
                  onClick={handleAddAdmin}
                  className="w-full flex items-center px-3 py-2 text-[14px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#343D52] rounded-xl transition-all"
                >
                  <UserPlus className="w-4 h-4 mr-3" /> নতুন এডমিন
                </button>
              </div>

              <div className="h-px bg-slate-100 dark:bg-white/5 my-1 mx-2"></div>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-[14px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4 mr-3" /> লগআউট
              </button>
            </div>
          </div>
        )}

        {/* ইউজার ইনফো বার (কার্ড স্টাইল) */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#141821] transition-colors">
          
          {/* Avatar Updated */}
          <Avatar 
            src={user?.photoURL} 
            fallback={user?.displayName || "এডমিন"} 
            size="sm" 
            className="shrink-0 rounded-full w-9 h-9 object-cover"
          />
          
          <div className="overflow-hidden flex-1">
            <p className="text-[14px] font-semibold text-slate-900 dark:text-white truncate">
              {user?.displayName || "WSC Admin"}
            </p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate">
              {user?.email}
            </p>
          </div>

          {/* শুধুমাত্র থ্রি-ডট আইকনে ক্লিক করলেই পপআপ ওপেন হবে */}
          <button 
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              showSettingsMenu 
                ? "bg-slate-200 dark:bg-[#2A3143] text-slate-900 dark:text-white" 
                : "text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-[#2A3143] hover:text-slate-900 dark:hover:text-white"
            }`}
            aria-label="Settings Menu"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

      </div>
    </aside>
  );
}