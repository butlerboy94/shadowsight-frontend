"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDashboardSummary } from "@/lib/api";
import { useAura } from "@/context/AuraContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Shield, Eye, AlertTriangle, Sparkles } from "lucide-react";
import type { AuraTask } from "@/context/AuraContext";

interface Summary {
  total_cases: number;
  open_cases: number;
  total_evidence: number;
  total_watchlist: number;
  recent_cases: {
    id: number;
    title: string;
    status: string;
    reference_id: string;
    created_at: string;
  }[];
}

const statusColor: Record<string, string> = {
  open: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  archived: "bg-[#C4922A]/20 text-[#C4922A] border-[#C4922A]/30",
};

export default function DashboardPage() {
  const router = useRouter();
  const { openAura } = useAura();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const auraShortcuts: { label: string; desc: string; task: AuraTask }[] = [
    { label: "Case Summary", desc: "Briefing on any case", task: "case_summary" },
    { label: "Subject Profile", desc: "Profile a person of interest", task: "subject_profile" },
    { label: "OSINT Interpretation", desc: "Analyze intelligence results", task: "osint_interpretation" },
    { label: "Threat Assessment", desc: "Assess a watchlist target", task: "threat_assessment" },
    { label: "Ask a Question", desc: "Q&A about any case", task: "case_qa" },
  ];

  useEffect(() => {
    getDashboardSummary()
      .then((res) => setSummary(res.data))
      .finally(() => setLoading(false));
  }, []);

  const stats = summary
    ? [
        { label: "Total Cases", value: summary.total_cases, icon: FolderOpen, color: "text-[#C4922A]", href: "/dashboard/cases" },
        { label: "Open Cases", value: summary.open_cases, icon: AlertTriangle, color: "text-yellow-400", href: "/dashboard/cases" },
        { label: "Evidence Items", value: summary.total_evidence, icon: Shield, color: "text-green-400", href: "/dashboard/evidence" },
        { label: "Watchlist Items", value: summary.total_watchlist, icon: Eye, color: "text-purple-400", href: "/dashboard/watchlist" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Overview of your investigative operations</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color, href }) => (
            <Card key={label} onClick={() => router.push(href)}
              className="bg-gray-900 border-gray-800 cursor-pointer hover:border-gray-600 transition-colors">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">{label}</p>
                    <p className="text-3xl font-bold text-white mt-1">{value}</p>
                  </div>
                  <Icon size={28} className={color} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Recent Cases</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : summary?.recent_cases.length === 0 ? (
            <p className="text-gray-500 text-sm">No cases yet. Create your first case.</p>
          ) : (
            <div className="space-y-2">
              {summary?.recent_cases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => router.push(`/dashboard/cases/${c.id}`)}
                  className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0 cursor-pointer hover:bg-gray-800/50 px-2 rounded transition-colors"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{c.title}</p>
                    <p className="text-gray-500 text-xs">{c.reference_id}</p>
                  </div>
                  <Badge
                    className={`text-xs border ${statusColor[c.status] ?? "bg-gray-700 text-gray-300"}`}
                  >
                    {c.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aura Quick Access */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Sparkles size={16} className="text-purple-400" /> Aura — AI Intelligence Analyst
          </CardTitle>
          <p className="text-gray-500 text-xs mt-0.5">Ask Aura to analyze your cases, subjects, OSINT, and watchlist targets</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {auraShortcuts.map((s) => (
              <button
                key={s.task}
                type="button"
                onClick={() => openAura({ task: s.task })}
                className="flex flex-col items-start gap-1 p-3 rounded-lg border border-gray-700 bg-gray-800/50 hover:border-purple-500/50 hover:bg-purple-500/10 transition-colors text-left"
              >
                <Sparkles size={13} className="text-purple-400" />
                <p className="text-white text-xs font-medium">{s.label}</p>
                <p className="text-gray-500 text-xs leading-snug">{s.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
