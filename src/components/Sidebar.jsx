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
  Bot,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";

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
        name: "Goals",
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
        icon: Bot,
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
  isCollapsed: propIsCollapsed,
  onToggleCollapse,
  mobileOpen: propMobileOpen,
  setMobileOpen: propSetMobileOpen,
}) {
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const mobileOpen = propMobileOpen !== undefined ? propMobileOpen : internalMobileOpen;
  const setMobileOpen = propSetMobileOpen || setInternalMobileOpen;

  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });
  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem("sidebar_collapsed", String(next));
        return next;
      });
    }
  };

  return (
    <>
      {/* MOBILE BUTTON */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-xl border border-[#E2E9DF] bg-white text-[#26261F] shadow-xs transition hover:scale-105 hover:border-[#4B5D3C] lg:hidden cursor-pointer"
      >
        <Menu size={20} />
      </button>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#26261F]/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* STATIC SIDEBAR (Collapsible: 285px expanded / 76px contracted) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full shrink-0 flex-col border-r border-[#E2E9DF] bg-white transition-all duration-300 ease-out lg:static lg:translate-x-0 ${
          isCollapsed ? "w-[76px]" : "w-[285px]"
        } ${mobileOpen ? "translate-x-0 w-[285px]" : "-translate-x-full"}`}
      >
        {/* MOBILE ONLY BRAND HEADER (Desktop brand is permanently fixed in top header) */}
        <div className="flex h-[84px] shrink-0 items-center justify-between border-b border-[#E2E9DF] px-6 lg:hidden">
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

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="text-slate-500 hover:text-[#26261F] p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
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
              onClick={toggleCollapse}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E2E9DF] bg-[#F4F1E8] text-[#4B5D3C] hover:bg-[#E2E9DF] transition cursor-pointer shadow-2xs"
              title="Expand sidebar menu"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* NAVIGATION LINKS CONTAINER WITH SAFE BOTTOM PADDING */}
        <div className={`flex-1 overflow-y-auto pb-10 ${isCollapsed ? "px-2 py-3 space-y-3" : "px-4 py-6 space-y-6"}`}>
          {navigation.map((section, sIdx) => (
            <div key={section.label}>
              {!isCollapsed ? (
                <div className="flex items-center justify-between px-3 mb-2.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4B5D3C]">
                    {section.label}
                  </p>
                  {/* Arrow collapse button on the Overview line towards the scrollbar */}
                  {section.label === "Overview" && (
                    <button
                      type="button"
                      onClick={toggleCollapse}
                      className="hidden lg:flex h-6 w-6 items-center justify-center rounded-md border border-[#E2E9DF] bg-[#F4F1E8] text-[#4B5D3C] hover:bg-[#E2E9DF] transition cursor-pointer shadow-2xs"
                      title="Collapse sidebar menu"
                    >
                      <ChevronLeft size={14} />
                    </button>
                  )}
                </div>
              ) : (
                sIdx > 0 && <div className="my-2 border-t border-[#E2E9DF]/80 mx-2" />
              )}

              <div className={`space-y-1.5 ${isCollapsed ? "flex flex-col items-center" : ""}`}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      title={item.name}
                      className={({ isActive }) =>
                        `group relative flex items-center transition-all duration-200 ${
                          isCollapsed
                            ? `justify-center h-11 w-11 rounded-xl mx-auto ${
                                isActive
                                  ? "bg-[#E2E9DF]/70 text-[#4B5D3C] shadow-xs font-bold"
                                  : "text-slate-500 hover:bg-[#F4F1E8] hover:text-[#4B5D3C]"
                              }`
                            : `gap-3.5 rounded-xl px-3.5 py-3 text-[14px] font-medium ${
                                isActive
                                  ? "bg-[#E2E9DF]/70 text-[#4B5D3C] shadow-xs font-bold"
                                  : "text-[#26261F] hover:bg-[#F4F1E8] hover:text-[#4B5D3C]"
                              }`
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && !isCollapsed && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full bg-[#4B5D3C] h-6 w-1" />
                          )}
                          <Icon
                            size={19}
                            strokeWidth={item.path === "/coach" || item.path === "/insights" ? 2 : 1.8}
                            className={
                              isActive
                                ? "text-[#4B5D3C]"
                                : "text-slate-400 group-hover:text-[#4B5D3C] transition-colors"
                            }
                          />
                          {!isCollapsed && <span>{item.name}</span>}

                          {/* Hover Tooltip when sidebar is contracted */}
                          {isCollapsed && (
                            <div className="pointer-events-none absolute left-full ml-3 hidden rounded-lg bg-[#26261F] px-2.5 py-1 text-xs font-bold text-white shadow-md group-hover:block z-50 whitespace-nowrap animate-fade-in">
                              {item.name}
                            </div>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}