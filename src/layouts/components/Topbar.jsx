import { Menu, Bell, Sun, Moon, UserCircle } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

export default function Topbar({ setMobileOpen }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 z-40 sticky top-0 transition-colors">
      <div className="flex items-center">
        <button onClick={() => setMobileOpen(true)} className="lg:hidden mr-4 p-2 text-slate-500 dark:text-slate-400">
          <Menu className="w-5 h-5" />
        </button>
        {/* Search bar removed as per request */}
      </div>
      <div className="flex items-center space-x-2 md:space-x-4">
        <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
          {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
        </button>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
        <div className="flex items-center space-x-2 cursor-pointer">
          <UserCircle className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Admin User</p>
          </div>
        </div>
      </div>
    </header>
  );
}