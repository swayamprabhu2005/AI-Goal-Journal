import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AppShell() {
  const location = useLocation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-close mobile drawer on route navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 flex flex-col">
      {/* 1. PERMANENT TOP HEADER (84px height) - ALWAYS VISIBLE */}
      <div className="flex h-[84px] shrink-0 border-b border-slate-200 bg-white z-30">
        {/* Top-Left Brand Block: Fixed, Never Collapses */}
        <div className="hidden lg:flex h-full w-[285px] shrink-0 items-center border-r border-slate-200 px-6 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-xs p-1 animate-float overflow-hidden">
              <img src="/logo.png" alt="AI Journal Logo" className="h-full w-full object-contain rounded-lg" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-900">
                AI JOURNAL
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
                Growth workspace
              </p>
            </div>
          </div>
        </div>

        {/* Top-Right Navbar: Page title, search, coach badge, notifs, account */}
        <div className="flex-1 min-w-0">
          <Navbar />
        </div>
      </div>

      {/* 2. BODY WORKSPACE BELOW HEADER */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Main page content area */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50 transition-all duration-300 ease-in-out">
          <div key={location.pathname} className="page-enter min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
