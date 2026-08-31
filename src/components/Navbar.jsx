import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Check,
  Sparkles,
  Target,
  BookOpen,
  X,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { goals = [], summary, journals = [] } = useData();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [readIds, setReadIds] = useState([]);

  const popoverRef = useRef(null);
  const accountRef = useRef(null);

  const email = user?.email || "user@example.com";
  const initial = email.charAt(0).toUpperCase();

  const notificationsList = [
    {
      id: "notif-1",
      icon: Sparkles,
      title: summary?.headline ? "Weekly AI Summary Ready" : "AI Coach Insight Available",
      message: summary?.headline
        ? `"${summary.headline}"`
        : "Generate your weekly accountability review in the AI Coach tab.",
      link: "/coach",
      time: "Recent",
    },
    {
      id: "notif-2",
      icon: Target,
      title: "Goal Reminder",
      message:
        goals.length > 0
          ? `You have ${goals.filter((g) => g.status === "Active").length} active goals in progress. Keep up the momentum!`
          : "Set your first goal milestone to track progress.",
      link: "/goals",
      time: "Today",
    },
    {
      id: "notif-3",
      icon: BookOpen,
      title: "Daily Journal Prompt",
      message:
        journals.length > 0
          ? `Last entry logged ${new Date(journals[0]?.created_at || Date.now()).toLocaleDateString()}. How is your day going?`
          : "Record your daily voice or text reflection.",
      link: "/journal",
      time: "Daily",
    },
  ];

  const unreadCount = notificationsList.filter((n) => !readIds.includes(n.id)).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function markAllRead() {
    setReadIds(notificationsList.map((n) => n.id));
  }

  async function handleLogout() {
    setShowAccountMenu(false);
    await logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur-xl md:px-8 shadow-sm">
      {/* LEFT */}
      <div className="ml-12 lg:ml-0">
        <div className="hidden items-center gap-2 md:flex">
          <span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-800">
            Personal growth workspace
          </span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        {/* NOTIFICATION BUTTON & POPOVER */}
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-teal-600 hover:text-teal-700"
            title="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
            )}
          </button>

          {/* NOTIFICATIONS POPOVER DROPDOWN */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 p-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-teal-700" />
                  <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-slate-500 hover:text-teal-700 transition flex items-center gap-1 font-semibold"
                    >
                      <Check size={12} /> Mark read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notificationsList.map((n) => {
                  const Icon = n.icon;
                  const isRead = readIds.includes(n.id);
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        setReadIds((prev) => [...prev, n.id]);
                        setShowNotifications(false);
                        if (n.link) navigate(n.link);
                      }}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                        isRead
                          ? "bg-slate-50 border-slate-100 opacity-75"
                          : "bg-teal-50/40 border-teal-200 hover:border-teal-400"
                      }`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white mt-0.5">
                        <Icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ACCOUNT BUTTON & DROPDOWN MENU */}
        <div className="relative" ref={accountRef}>
          <button
            type="button"
            onClick={() => setShowAccountMenu((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 transition hover:border-teal-600"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-xs font-bold text-white">
              {initial}
            </div>
            <div className="hidden sm:block text-left">
              <p className="max-w-[120px] truncate text-xs font-bold text-slate-900">
                {email}
              </p>
              <p className="text-[9px] text-slate-500 font-semibold">
                Account
              </p>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {/* ACCOUNT DROPDOWN MENU */}
          {showAccountMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 p-2">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900 truncate">{email}</p>
                <p className="text-[10px] font-bold text-teal-700 uppercase tracking-wider mt-0.5">Personal Workspace</p>
              </div>

              <button
                onClick={() => {
                  setShowAccountMenu(false);
                  navigate("/profile");
                }}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <User size={15} className="text-slate-500" />
                <span>Profile</span>
              </button>

              <button
                onClick={() => {
                  setShowAccountMenu(false);
                  navigate("/settings");
                }}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <Settings size={15} className="text-slate-500" />
                <span>Settings</span>
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}