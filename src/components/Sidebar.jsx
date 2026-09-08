import {
  LayoutDashboard,
  Calendar,
  Target,
  BookOpen,
  Sparkles,
  TrendingUp,
  User,
  Settings,
  Repeat,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigation = [
  {
    label: "Overview",
    items: [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        name: "Calendar",
        path: "/calendar",
        icon: Calendar,
      },
      {
        name: "Progress",
        path: "/progress",
        icon: TrendingUp,
      },
    ],
  },
  {
    label: "Growth",
    items: [
      {
        name: "AI Journal",
        path: "/journal",
        icon: BookOpen,
      },
      {
        name: "Manual Goal",
        path: "/goals",
        icon: Target,
      },
      {
        name: "Habits",
        path: "/habits",
        icon: Repeat,
      },
      {
        name: "AI Coach",
        path: "/coach",
        icon: Sparkles,
      },
      {
        name: "AI Insights",
        path: "/insights",
        icon: Sparkles,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        name: "Profile",
        path: "/profile",
        icon: User,
      },
      {
        name: "Settings",
        path: "/settings",
        icon: Settings,
      },
    ],
  },
];

export default function Sidebar({
  isCollapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  setMobileOpen,
}) {
  return (
    <>
      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        />
      )}

      {/* STATIC / COLLAPSIBLE SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out lg:static ${
          mobileOpen ? "translate-x-0 w-[285px]" : "-translate-x-full lg:translate-x-0"
        } ${
          isCollapsed ? "lg:w-[76px]" : "lg:w-[285px]"
        }`}
      >
        <div className={`h-full flex flex-col shrink-0 transition-all duration-300 ${isCollapsed ? "w-[76px]" : "w-[285px]"}`}>
          {/* MOBILE ONLY BRAND HEADER (Desktop brand is permanently fixed in top header) */}
          <div className="flex h-[84px] shrink-0 items-center justify-between border-b border-slate-200 px-6 lg:hidden">
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

            <button
              type="button"
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className="text-slate-500 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title="Close navigation"
            >
              <X size={20} />
            </button>
          </div>

          {/* DESKTOP COLLAPSED TOP ARROW: Expand button centered at top of mini rail */}
          {isCollapsed && (
            <div className="hidden lg:flex items-center justify-center pt-5 pb-2">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-white transition cursor-pointer shadow-2xs"
                title="Expand sidebar menu"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* NAVIGATION LINKS CONTAINER WITH SAFE BOTTOM PADDING */}
          <div className={`flex-1 overflow-y-auto pb-10 ${isCollapsed ? "px-2 py-3 space-y-3" : "px-4 py-6 space-y-7"}`}>
            {navigation.map((section, sIdx) => (
              <div key={section.label}>
                {!isCollapsed ? (
                  <div className="flex items-center justify-between px-3 mb-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      {section.label}
                    </p>
                    {/* Arrow collapse button on the Overview line towards the scrollbar */}
                    {section.label === "Overview" && onToggleCollapse && (
                      <button
                        type="button"
                        onClick={onToggleCollapse}
                        className="hidden lg:flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-white transition cursor-pointer shadow-2xs"
                        title="Collapse sidebar menu"
                      >
                        <ChevronLeft size={14} />
                      </button>
                    )}
                  </div>
                ) : (
                  sIdx > 0 && <div className="my-2 border-t border-slate-100 mx-2" />
                )}

                <div className={`space-y-1.5 ${isCollapsed ? "flex flex-col items-center" : ""}`}>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen && setMobileOpen(false)}
                        title={item.name}
                        className={({ isActive }) =>
                          `group relative flex items-center transition-all duration-200 ${
                            isCollapsed
                              ? `justify-center h-11 w-11 rounded-xl mx-auto ${
                                  isActive
                                    ? "bg-indigo-50 text-indigo-600 shadow-sm font-bold nav-active-glow"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                }`
                              : `gap-3.5 rounded-xl px-3.5 py-3 text-[15px] font-medium ${
                                  isActive
                                    ? "bg-indigo-50 text-indigo-600 shadow-sm font-bold nav-active-glow"
                                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-0.5"
                                }`
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && !isCollapsed && (
                              <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600" />
                            )}
                            <Icon
                              size={20}
                              strokeWidth={item.path === "/coach" || item.path === "/insights" ? 2 : 1.8}
                              className={
                                isActive
                                  ? "text-indigo-600"
                                  : "text-slate-400 group-hover:text-slate-600 transition-colors"
                              }
                            />
                            {!isCollapsed && <span>{item.name}</span>}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}