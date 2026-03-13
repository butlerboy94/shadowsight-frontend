"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, globalSearch } from "@/lib/api";
import { Menu, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface User { username: string; email: string; first_name: string; last_name: string; }
interface SearchResults { cases: unknown[]; people: unknown[]; evidence: unknown[]; osint: unknown[]; }

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    getMe().then((res) => setUser(res.data)).catch(() => {});
  }, []);

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
        onClick={onMenuClick}
        className="lg:hidden text-gray-400 hover:text-white transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cases, people, evidence..."
          className="pl-8 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-8 text-sm"
        />
        {query && (
          <button
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

      {/* User avatar */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-full bg-[#C4922A] flex items-center justify-center">
          <span className="text-white text-xs font-semibold">{initials}</span>
        </div>
        <span className="text-gray-300 text-sm hidden sm:block">{displayName}</span>
      </div>
    </header>
  );
}
