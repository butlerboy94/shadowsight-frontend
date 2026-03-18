"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, globalSearch, getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api";
import { Menu, Search, X, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";

interface User { username: string; email: string; first_name: string; last_name: string; }
interface SearchResults { cases: unknown[]; people: unknown[]; evidence: unknown[]; osint: unknown[]; }
interface Notification {
  id: number;
  title: string;
  message: string;
  notif_type: string;
  read: boolean;
  link: string;
  created_at: string;
}

interface TopBarProps {
  onMenuClick: () => void;
}

const notifTypeColor: Record<string, string> = {
  info:    "bg-blue-500",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  alert:   "bg-red-500",
};

export default function TopBar({ onMenuClick }: TopBarProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    getMe().then((res) => setUser(res.data)).catch(() => {});
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  function fetchNotifications() {
    getNotifications()
      .then((res) => setNotifications(res.data.results ?? res.data))
      .catch(() => {});
  }

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleNotifClick(n: Notification) {
    if (!n.read) {
      await markNotificationRead(n.id);
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
    }
    setNotifOpen(false);
    if (n.link) router.push(n.link);
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  useEffect(() => {
    if (!query.trim()) { setResults(null); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await globalSearch(query);
        setResults(res.data);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const displayName = user
    ? (user.first_name || user.last_name)
      ? `${user.first_name} ${user.last_name}`.trim()
      : user.username
    : "";

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const totalResults = results
    ? Object.values(results).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
    : 0;

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 gap-4 sticky top-0 z-30">
      {/* Mobile hamburger */}
      <button
        type="button"
        title="Open menu"
        onClick={onMenuClick}
        className="lg:hidden text-gray-400 hover:text-white transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <Input
          id="topbar-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cases, people, evidence..."
          className="pl-8 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-8 text-sm"
        />
        {query && (
          <button
            type="button"
            title="Clear search"
            onClick={() => { setQuery(""); setResults(null); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
          >
            <X size={12} />
          </button>
        )}

        {/* Search dropdown */}
        {query && (
          <div className="absolute top-full mt-1 w-full bg-gray-900 border border-gray-700 rounded-md shadow-xl z-50 max-h-80 overflow-auto">
            {searching ? (
              <p className="text-gray-400 text-xs px-3 py-3">Searching...</p>
            ) : totalResults === 0 ? (
              <p className="text-gray-500 text-xs px-3 py-3">No results for &quot;{query}&quot;</p>
            ) : (
              <div className="py-1">
                {results && Object.entries(results).map(([type, items]) => {
                  if (!Array.isArray(items) || items.length === 0) return null;
                  return (
                    <div key={type}>
                      <p className="text-gray-500 text-[10px] uppercase tracking-wide px-3 pt-2 pb-1">{type}</p>
                      {(items as Record<string, unknown>[]).slice(0, 3).map((item) => (
                        <button
                          type="button"
                          key={String(item.id)}
                          onClick={() => {
                            if (type === "cases") router.push(`/dashboard/cases/${item.id}`);
                            setQuery(""); setResults(null);
                          }}
                          className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                        >
                          {String(item.title ?? item.first_name ?? item.query_value ?? item.id)}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side: notifications + user */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-800">
                <p className="text-white text-sm font-medium">Notifications</p>
                {unreadCount > 0 && (
                  <button type="button" onClick={handleMarkAllRead}
                    className="text-xs text-[#C4922A] hover:text-[#A67822]">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell size={20} className="mx-auto text-gray-700 mb-2" />
                    <p className="text-gray-500 text-sm">No notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleNotifClick(n)}
                      className={`w-full text-left px-3 py-3 border-b border-gray-800 last:border-0 hover:bg-gray-800 transition-colors flex items-start gap-2.5 ${!n.read ? "bg-gray-800/40" : ""}`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notifTypeColor[n.notif_type] ?? "bg-gray-500"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${n.read ? "text-gray-400" : "text-white"}`}>{n.title}</p>
                        {n.message && <p className="text-gray-500 text-xs mt-0.5 truncate">{n.message}</p>}
                        <p className="text-gray-600 text-xs mt-0.5">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[#C4922A] shrink-0 mt-1.5" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#C4922A] flex items-center justify-center">
            <span className="text-white text-xs font-semibold">{initials}</span>
          </div>
          <span className="text-gray-300 text-sm hidden sm:block">{displayName}</span>
        </div>
      </div>
    </header>
  );
}
