import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { Menu } from "lucide-react";

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    // bg-slate-950 এর বদলে bg-transparent দেওয়া হয়েছে যাতে বডির গ্লোবাল গ্রেডিয়েন্ট কাজ করে
    <div className="flex h-screen bg-transparent font-sans overflow-hidden transition-colors duration-300">
      
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <Sidebar isOpen={mobileOpen} setIsOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent">
        
        {/* Mobile Header (শুধুমাত্র মোবাইলে দেখাবে সাইডবার ওপেন করার জন্য) */}
        <div className="lg:hidden flex items-center p-4 bg-white/40 dark:bg-black/20 backdrop-blur-md border-b border-slate-200 dark:border-white/10 z-30">
          <button 
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors focus:outline-none"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-3 font-semibold text-slate-800 dark:text-white font-sans tracking-wide">
            ড্যাশবোর্ড
          </span>
        </div>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar bg-transparent">
          <Outlet />
        </main>
        
      </div>
    </div>
  );
}