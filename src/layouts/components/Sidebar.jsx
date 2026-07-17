import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { SIDEBAR_MENU } from "@/constants/sidebar";
import { useAuth } from "@/providers/AuthProvider";
import { LogOut, ChevronDown } from "lucide-react";
import { appConfig } from "@/config/appConfig";

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});

  // Auto-open dropdown if active child is present
  useEffect(() => {
    const currentPath = location.pathname;
    const newOpenMenus = { ...openMenus };
    
    SIDEBAR_MENU.forEach(item => {
      if (item.subItems) {
        const isChildActive = item.subItems.some(sub => currentPath.startsWith(sub.path));
        if (isChildActive) {
          newOpenMenus[item.title] = true;
        }
      }
    });
    setOpenMenus(newOpenMenus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleMenu = (title) => {
    setOpenMenus(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:static`}>
      <div className="h-16 flex items-center px-4 bg-slate-950 text-white border-b border-slate-800">
        <img src={appConfig.schoolLogo} alt="Logo" className="w-8 h-8 mr-3 object-contain" />
        <span className="text-sm font-bold leading-tight">{appConfig.schoolName}</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2 custom-scrollbar">
        {SIDEBAR_MENU.map((item, index) => {
          const Icon = item.icon;
          const hasSub = !!item.subItems;
          const isOpen = openMenus[item.title];
          const isParentActive = hasSub && item.subItems.some(sub => location.pathname.startsWith(sub.path));

          return (
            <div key={index}>
              {hasSub ? (
                <button
                  onClick={() => toggleMenu(item.title)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isParentActive && !isOpen
                      ? "bg-slate-800 text-white shadow-sm" 
                      : isOpen 
                      ? "bg-slate-800 text-white" 
                      : "hover:bg-slate-800/80 hover:text-white text-slate-400"
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className={`w-5 h-5 mr-3 ${isParentActive || isOpen ? "text-blue-500" : ""}`} /> 
                    {item.title}
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-500" : ""}`} />
                </button>
              ) : (
                <NavLink
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${location.pathname === item.path ? "text-white" : ""}`} /> 
                  {item.title}
                </NavLink>
              )}

              {/* Nested Dropdown Items */}
              {hasSub && (
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
                  <div className="ml-4 pl-4 border-l border-slate-700/50 space-y-1 py-1">
                    {item.subItems.map((sub, subIdx) => (
                      <NavLink
                        key={subIdx}
                        to={sub.path}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) => `block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive 
                            ? "bg-blue-600/10 text-blue-400 font-semibold" 
                            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                        }`}
                      >
                        {sub.title}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-slate-800">
        <button onClick={() => { logout(); navigate("/login"); }} className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </button>
      </div>
    </aside>
  );
}