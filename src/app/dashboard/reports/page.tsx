"use client";

import { useEffect, useState } from "react";
import { getReports, createReport, generatePdf, getCases, updateReport, deleteReport } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, X, Download, Trash2, Pencil, Check } from "lucide-react";
import { toast } from "sonner";

interface Report {
  id: number;
  title: string;
  report_type: string;
  status: string;
  content: string;
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
  const [deleting, setDeleting] = useState<number | null>(null);

  // Notes editor state
  const [editNotesId, setEditNotesId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

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

  async function handleDelete(id: number) {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success("Report deleted");
    } catch {
      toast.error("Failed to delete report");
    } finally {
      setDeleting(null);
    }
  }

  function startEditNotes(r: Report) {
    setEditNotesId(r.id);
    setEditNotes(r.content ?? "");
  }

  async function handleSaveNotes(id: number) {
    setSavingNotes(true);
    try {
      await updateReport(id, { content: editNotes });
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, content: editNotes } : r));
      setEditNotesId(null);
      toast.success("Analyst notes saved");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
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
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white" title="Close"><X size={16} /></button>
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
                    title="Report type"
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
                    title="Linked case"
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
                <div key={r.id}>
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{r.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{r.report_type} · {new Date(r.created_at).toLocaleDateString()}</p>
                      {r.content && editNotesId !== r.id && (
                        <p className="text-gray-500 text-xs mt-1 italic truncate">{r.content}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-xs border ${statusColor[r.status] ?? "bg-gray-700 text-gray-300"}`}>{r.status}</Badge>
                      {r.pdf_url && (
                        <Button size="sm"
                          onClick={() => window.open(r.pdf_url!, "_blank")}
                          className="bg-[#C4922A] hover:bg-[#A67822] text-white h-7 px-2">
                          <Download size={12} className="mr-1" /> PDF
                        </Button>
                      )}
                      <Button size="sm"
                        onClick={() => handleGeneratePdf(r.id)}
                        disabled={generating === r.id}
                        variant="outline"
                        className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 h-7 px-2">
                        {generating === r.id ? "..." : r.pdf_url ? "Regenerate" : "Generate PDF"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => editNotesId === r.id ? setEditNotesId(null) : startEditNotes(r)}
                        title="Edit analyst notes"
                        className="p-1 rounded text-gray-600 hover:text-[#C4922A] hover:bg-[#C4922A]/10 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        disabled={deleting === r.id}
                        title="Delete report"
                        className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {editNotesId === r.id && (
                    <div className="pb-4 space-y-2">
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={4}
                        placeholder="Write analyst notes for this report. These will appear in the generated PDF under 'Analyst Notes'."
                        className="w-full rounded-md bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 placeholder:text-gray-600 resize-none"
                      />
                      <div className="flex gap-2">
                        <Button type="button" onClick={() => handleSaveNotes(r.id)}
                          disabled={savingNotes}
                          className="h-7 px-3 text-xs bg-[#C4922A] hover:bg-[#A67822] text-white">
                          <Check size={12} className="mr-1" />{savingNotes ? "Saving..." : "Save Notes"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setEditNotesId(null)}
                          className="h-7 px-3 text-xs border-gray-700 text-gray-300 hover:bg-gray-800">Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
