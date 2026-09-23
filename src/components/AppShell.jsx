import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AppShell() {
  const location = useLocation();
  const mainRef = useRef(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-close mobile drawer and scroll workspace to top on route navigation
  useEffect(() => {
    setMobileOpen(false);
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
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
    <div className="h-screen w-screen overflow-hidden bg-slate-50 text-[#26261F] flex flex-col">
      {/* 1. PERMANENT TOP HEADER (84px height) - ALWAYS VISIBLE */}
      <div className="flex h-[84px] shrink-0 border-b border-[#E2E9DF] bg-white z-30">
        {/* Top-Left Brand Block: Fixed, Never Collapses */}
        <div className="hidden lg:flex h-full w-[285px] shrink-0 items-center border-r border-[#E2E9DF] px-6 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-[#E2E9DF] shadow-xs p-1 animate-float overflow-hidden">
              <img src="/logo.png" alt="AI Journal Logo" className="h-full w-full object-contain rounded-lg" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-[#26261F] font-serif">
                AI JOURNAL
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#4B5D3C] font-extrabold">
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
        <main ref={mainRef} className="flex-1 min-w-0 overflow-y-auto bg-[#F4F1E8]/30 transition-all duration-300 ease-in-out">
          <div key={location.pathname} className="page-enter min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
