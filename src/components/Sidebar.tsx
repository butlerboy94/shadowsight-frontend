"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { clearTokens } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Shield,
  Search,
  FileText,
  Eye,
  LogOut,
  X,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/cases", label: "Cases", icon: FolderOpen },
  { href: "/dashboard/people", label: "People", icon: Users },
  { href: "/dashboard/osint", label: "OSINT", icon: Search },
  { href: "/dashboard/evidence", label: "Evidence", icon: Shield },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/watchlist", label: "Watchlist", icon: Eye },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearTokens();
    router.push("/login");
  }

  const sidebarContent = (
    <aside className="w-60 h-full bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
        <Image src="/logo.png" alt="ShadowSight Logo" width={120} height={40} className="object-contain" priority />
        <button type="button" onClick={onClose} className="lg:hidden text-gray-500 hover:text-white ml-2" title="Close menu">
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-[#C4922A] text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-800">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden lg:flex min-h-screen">{sidebarContent}</div>

      {/* Mobile: overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={onClose} />
          <div className="relative z-50 flex h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
