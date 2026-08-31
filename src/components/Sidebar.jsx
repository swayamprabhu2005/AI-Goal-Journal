import {
  LayoutDashboard,
  Target,
  BookOpen,
  Sparkles,
  TrendingUp,
  User,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";

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
        name: "Goals",
        path: "/goals",
        icon: Target,
      },
      {
        name: "Journal",
        path: "/journal",
        icon: BookOpen,
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

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* MOBILE BUTTON */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-md lg:hidden"
      >
        <Menu size={19} />
      </button>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* STATIC NON-SCROLLABLE LIGHT THEME SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[255px] shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* BRAND */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-md">
              <Target size={19} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-slate-900">
                GOAL JOURNAL
              </p>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-teal-700">
                Growth workspace
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="text-slate-500 hover:text-slate-800 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <div className="flex-1 px-3 py-5 overflow-hidden">
          {navigation.map((section) => (
            <div key={section.label} className="mb-6">
              <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-teal-700">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                          isActive
                            ? "bg-teal-700 text-white shadow-md"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`
                      }
                    >
                      <Icon size={17} strokeWidth={2} />
                      <span>{item.name}</span>
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