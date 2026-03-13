"use client";

import { useEffect, useState } from "react";
import { getReports, createReport, generatePdf, getCases, API_BASE } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, X, Download } from "lucide-react";
import { toast } from "sonner";

interface Report {
  id: number;
  title: string;
  report_type: string;
  status: string;
  pdf_url: string | null;
  created_at: string;
  case: number;
}
interface Case { id: number; title: string; }

const statusColor: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  final: "bg-green-500/20 text-green-400 border-green-500/30",
  archived: "bg-[#C4922A]/20 text-[#C4922A] border-[#C4922A]/30",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", report_type: "case_summary", case: "" });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<number | null>(null);

  function fetchReports() {
    getReports()
      .then((res) => setReports(res.data.results ?? res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchReports();
    getCases().then((res) => setCases(res.data.results ?? res.data));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createReport({ ...form, case: form.case ? Number(form.case) : undefined });
      setForm({ title: "", report_type: "case_summary", case: "" });
      setShowForm(false);
      fetchReports();
      toast.success("Report created");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string; case?: string[]; report_type?: string[] } } })
          ?.response?.data?.detail ||
        Object.values(
          (err as { response?: { data?: Record<string, string[]> } })?.response?.data ?? {}
        )
          .flat()
          .join(", ") ||
        "Failed to create report";
      toast.error(msg);
      console.error("Create report error:", (err as { response?: unknown })?.response);
    } finally {
      setSaving(false);
    }
  }

  async function handleGeneratePdf(id: number) {
    setGenerating(id);
    try {
      await generatePdf(id);
      fetchReports();
      toast.success("PDF generated successfully");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Reports</h1>
          <p className="text-gray-400 text-sm mt-1">Generate and manage case reports</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-[#C4922A] hover:bg-[#A67822] text-white">
          <Plus size={16} className="mr-2" /> New Report
        </Button>
      </div>

      {showForm && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white text-base">Create Report</CardTitle>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X size={16} /></button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-gray-300">Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Report title" required
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-gray-300">Type</Label>
                  <select value={form.report_type} onChange={(e) => setForm({ ...form, report_type: e.target.value })}
                    className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm">
                    {[
                      { value: "case_summary", label: "Case Summary" },
                      { value: "person_profile", label: "Person Profile" },
                      { value: "evidence_log", label: "Evidence Log" },
                      { value: "osint_summary", label: "OSINT Summary" },
                      { value: "full_report", label: "Full Report" },
                    ].map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-300">Case</Label>
                  <select value={form.case} onChange={(e) => setForm({ ...form, case: e.target.value })}
                    required
                    className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm">
                    <option value="" disabled>— Select a case —</option>
                    {cases.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-[#C4922A] hover:bg-[#A67822] text-white" disabled={saving}>
                  {saving ? "Creating..." : "Create Report"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800">Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2"><FileText size={16} /> Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded bg-gray-800 animate-pulse" />)}</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <FileText size={24} className="text-gray-600" />
              </div>
              <p className="text-white font-medium">No reports yet</p>
              <p className="text-gray-500 text-sm mt-1">Create a report and generate a PDF for your cases</p>
              <button type="button" onClick={() => setShowForm(true)} className="mt-4 text-[#C4922A] text-sm hover:underline">
                + Create first report
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {reports.map((r) => (
                <div key={r.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{r.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{r.report_type} · {new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`text-xs border ${statusColor[r.status] ?? "bg-gray-700 text-gray-300"}`}>{r.status}</Badge>
                    {r.pdf_url ? (
                      <a href={`${API_BASE}${r.pdf_url}`} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 h-7 px-2">
                          <Download size={12} className="mr-1" /> PDF
                        </Button>
                      </a>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleGeneratePdf(r.id)}
                        disabled={generating === r.id}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800 h-7 px-2">
                        {generating === r.id ? "..." : "Generate PDF"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
