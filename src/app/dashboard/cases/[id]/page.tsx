"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCase, getPeople, getEvidence, getOsintResults, uploadEvidence, updateCase, createPerson, updatePerson } from "@/lib/api";
import { useAura } from "@/context/AuraContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Shield, Search, Calendar, Upload, X, Pencil, Check, Clock, Plus, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Case {
  id: number; title: string; description: string; notes: string; status: string;
  reference_id: string; created_at: string;
}
interface Person { id: number; first_name: string; last_name: string; email: string; phone: string; role: string; cases: number[]; }
interface Evidence { id: number; original_filename: string; content_type: string; uploaded_at: string; sha256: string; }
interface OsintResult { id: number; query_type: string; query_value: string; provider: string; summary: string; created_at: string; }

const statusColor: Record<string, string> = {
  open: "bg-green-500/20 text-green-400 border-green-500/30",
  in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};
const statusLabel: Record<string, string> = { open: "Open", in_progress: "In Progress", closed: "Closed" };

function guessContentType(file: File): string {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type === "application/pdf" || file.type.startsWith("text/") || file.type.includes("word") || file.name.endsWith(".pdf")) return "document";
  return "other";
}

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { openAura } = useAura();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [osint, setOsint] = useState<OsintResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline status edit
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  // Case notes
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Subject CRUD
  const ROLES = ["subject", "suspect", "witness", "victim", "associate"];
  const roleColor: Record<string, string> = {
    suspect: "bg-red-500/20 text-red-400 border-red-500/30",
    witness: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    victim: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    associate: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    subject: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ first_name: "", last_name: "", email: "", phone: "", role: "subject" });
  const [savingSubject, setSavingSubject] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState<number | null>(null);
  const [editSubjectForm, setEditSubjectForm] = useState({ first_name: "", last_name: "", email: "", phone: "", role: "subject" });
  const [savingEditSubject, setSavingEditSubject] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState<number | null>(null);

  async function handleAddSubject(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!id) return;
    setSavingSubject(true);
    try {
      await createPerson({ ...subjectForm, cases: [Number(id)] });
      setSubjectForm({ first_name: "", last_name: "", email: "", phone: "", role: "subject" });
      setShowAddSubject(false);
      const res = await getPeople();
      const all = res.data.results ?? res.data;
      setPeople(all.filter((p: Person) => p.cases?.includes(Number(id))));
      toast.success("Subject added");
    } catch {
      toast.error("Failed to add subject");
    } finally {
      setSavingSubject(false);
    }
  }

  function startEditSubject(p: Person) {
    setEditSubjectId(p.id);
    setEditSubjectForm({ first_name: p.first_name, last_name: p.last_name, email: p.email ?? "", phone: p.phone ?? "", role: p.role ?? "subject" });
  }

  async function handleEditSubjectSave(p: Person) {
    setSavingEditSubject(true);
    try {
      await updatePerson(p.id, editSubjectForm);
      setPeople((prev) => prev.map((x) => x.id === p.id ? { ...x, ...editSubjectForm } : x));
      setEditSubjectId(null);
      toast.success("Subject updated");
    } catch {
      toast.error("Failed to update subject");
    } finally {
      setSavingEditSubject(false);
    }
  }

  async function handleUnlinkSubject(p: Person) {
    if (!confirm(`Remove ${p.first_name} ${p.last_name} from this case?`)) return;
    setDeletingSubject(p.id);
    try {
      await updatePerson(p.id, { cases: p.cases.filter((c) => c !== Number(id)) });
      setPeople((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Subject removed from case");
    } catch {
      toast.error("Failed to remove subject");
    } finally {
      setDeletingSubject(null);
    }
  }

  // Evidence upload
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function loadData() {
    if (!id) return;
    Promise.all([
      getCase(Number(id)),
      getPeople(),
      getEvidence(Number(id)),
      getOsintResults(Number(id)),
    ]).then(([caseRes, peopleRes, evidenceRes, osintRes]) => {
      setCaseData(caseRes.data);
      setNewStatus(caseRes.data.status);
      setNotesValue(caseRes.data.notes ?? "");
      const allPeople = peopleRes.data.results ?? peopleRes.data;
      setPeople(allPeople.filter((p: Person) => p.cases?.includes(Number(id))));
      setEvidence(evidenceRes.data.results ?? evidenceRes.data);
      setOsint(osintRes.data.results ?? osintRes.data);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStatusSave() {
    if (!caseData || newStatus === caseData.status) { setEditingStatus(false); return; }
    setSavingStatus(true);
    try {
      await updateCase(caseData.id, { status: newStatus });
      setCaseData((prev) => prev ? { ...prev, status: newStatus } : prev);
      setEditingStatus(false);
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleNotesSave() {
    if (!caseData) return;
    setSavingNotes(true);
    try {
      await updateCase(caseData.id, { notes: notesValue });
      setCaseData((prev) => prev ? { ...prev, notes: notesValue } : prev);
      setEditingNotes(false);
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleUpload(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!uploadFile || !id) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("case", id);
      fd.append("file", uploadFile);
      fd.append("description", uploadDesc);
      fd.append("content_type", guessContentType(uploadFile));
      await uploadEvidence(fd);
      setUploadFile(null);
      setUploadDesc("");
      setShowUpload(false);
      if (fileRef.current) fileRef.current.value = "";
      const res = await getEvidence(Number(id));
      setEvidence(res.data.results ?? res.data);
      toast.success("Evidence uploaded");
    } catch {
      toast.error("Failed to upload evidence");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
        <div className="h-32 bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-800 rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Case not found.</p>
        <Button onClick={() => router.push("/dashboard/cases")} className="mt-4 bg-[#C4922A] hover:bg-[#A67822] text-white">
          Back to Cases
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/cases")}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Cases
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">{caseData.title}</h1>
            <p className="text-gray-400 text-sm mt-1">{caseData.description}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-gray-500 text-xs flex items-center gap-1">
                <Calendar size={12} /> {new Date(caseData.created_at).toLocaleDateString()}
              </span>
              <span className="text-gray-600 text-xs font-mono">{caseData.reference_id}</span>
            </div>
          </div>

          {/* Status — click to edit */}
          <div className="flex items-center gap-2 ml-4 shrink-0">
            {editingStatus ? (
              <>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  title="Case status"
                  className="rounded bg-gray-800 border border-gray-700 text-white text-xs px-2 py-1"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
                <button type="button" onClick={handleStatusSave} disabled={savingStatus} title="Save status"
                  className="p-1 rounded text-green-400 hover:bg-green-400/10">
                  <Check size={14} />
                </button>
                <button type="button" onClick={() => setEditingStatus(false)} title="Cancel"
                  className="p-1 rounded text-gray-500 hover:text-white">
                  <X size={14} />
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setEditingStatus(true)} title="Edit status"
                className="flex items-center gap-1.5 group">
                <Badge className={`text-xs border ${statusColor[caseData.status] ?? "bg-gray-700 text-gray-300 border-gray-600"}`}>
                  {statusLabel[caseData.status] ?? caseData.status}
                </Badge>
                <Pencil size={12} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
              </button>
            )}
          </div>
        </div>

        {/* Aura quick actions */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button type="button"
            onClick={() => openAura({ task: "case_summary", caseId: caseData.id })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-colors">
            <Sparkles size={11} /> Case Summary
          </button>
          <button type="button"
            onClick={() => openAura({ task: "osint_interpretation", caseId: caseData.id })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-colors">
            <Sparkles size={11} /> OSINT Analysis
          </button>
          <button type="button"
            onClick={() => openAura({ task: "case_qa", caseId: caseData.id })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-colors">
            <Sparkles size={11} /> Ask Aura
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Subjects", value: people.length, icon: Users, color: "text-purple-400" },
          { label: "Evidence", value: evidence.length, icon: Shield, color: "text-green-400" },
          { label: "OSINT Queries", value: osint.length, icon: Search, color: "text-[#C4922A]" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-gray-900 border-gray-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">{label}</p>
                  <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
                </div>
                <Icon size={22} className={color} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subjects */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Users size={15} /> Subjects
            </CardTitle>
            <button type="button" onClick={() => setShowAddSubject(!showAddSubject)}
              className="flex items-center gap-1 text-xs text-[#C4922A] hover:text-[#A67822]">
              <Plus size={12} /> Add
            </button>
          </CardHeader>
          <CardContent>
            {showAddSubject && (
              <form onSubmit={handleAddSubject} className="mb-4 space-y-3 p-3 bg-gray-800/50 rounded-md border border-gray-700">
                <div className="grid grid-cols-2 gap-2">
                  <input required value={subjectForm.first_name} onChange={(e) => setSubjectForm({ ...subjectForm, first_name: e.target.value })}
                    placeholder="First name" className="rounded bg-gray-800 border border-gray-700 text-white text-xs px-2 py-1.5 placeholder:text-gray-500" />
                  <input required value={subjectForm.last_name} onChange={(e) => setSubjectForm({ ...subjectForm, last_name: e.target.value })}
                    placeholder="Last name" className="rounded bg-gray-800 border border-gray-700 text-white text-xs px-2 py-1.5 placeholder:text-gray-500" />
                  <input value={subjectForm.email} onChange={(e) => setSubjectForm({ ...subjectForm, email: e.target.value })}
                    placeholder="Email" type="email" className="rounded bg-gray-800 border border-gray-700 text-white text-xs px-2 py-1.5 placeholder:text-gray-500" />
                  <input value={subjectForm.phone} onChange={(e) => setSubjectForm({ ...subjectForm, phone: e.target.value })}
                    placeholder="Phone" className="rounded bg-gray-800 border border-gray-700 text-white text-xs px-2 py-1.5 placeholder:text-gray-500" />
                </div>
                <select value={subjectForm.role} onChange={(e) => setSubjectForm({ ...subjectForm, role: e.target.value })}
                  title="Role" className="w-full rounded bg-gray-800 border border-gray-700 text-white text-xs px-2 py-1.5">
                  {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
                <div className="flex gap-2">
                  <Button type="submit" disabled={savingSubject} className="h-7 px-3 text-xs bg-[#C4922A] hover:bg-[#A67822] text-white">
                    {savingSubject ? "Adding..." : "Add Subject"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddSubject(false)}
                    className="h-7 px-3 text-xs border-gray-700 text-gray-300 hover:bg-gray-800">Cancel</Button>
                </div>
              </form>
            )}
            {people.length === 0 && !showAddSubject ? (
              <div className="text-center py-8">
                <Users size={24} className="mx-auto text-gray-700 mb-2" />
                <p className="text-gray-500 text-sm">No subjects linked to this case</p>
                <button type="button" onClick={() => setShowAddSubject(true)}
                  className="mt-2 text-[#C4922A] text-xs hover:underline">+ Add subject</button>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {people.map((p) => (
                  <div key={p.id}>
                    {editSubjectId === p.id ? (
                      <div className="py-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input value={editSubjectForm.first_name} onChange={(e) => setEditSubjectForm({ ...editSubjectForm, first_name: e.target.value })}
                            placeholder="First name" className="rounded bg-gray-800 border border-gray-700 text-white text-xs px-2 py-1.5" />
                          <input value={editSubjectForm.last_name} onChange={(e) => setEditSubjectForm({ ...editSubjectForm, last_name: e.target.value })}
                            placeholder="Last name" className="rounded bg-gray-800 border border-gray-700 text-white text-xs px-2 py-1.5" />
                          <input value={editSubjectForm.email} onChange={(e) => setEditSubjectForm({ ...editSubjectForm, email: e.target.value })}
                            placeholder="Email" className="rounded bg-gray-800 border border-gray-700 text-white text-xs px-2 py-1.5" />
                          <input value={editSubjectForm.phone} onChange={(e) => setEditSubjectForm({ ...editSubjectForm, phone: e.target.value })}
                            placeholder="Phone" className="rounded bg-gray-800 border border-gray-700 text-white text-xs px-2 py-1.5" />
                        </div>
                        <select value={editSubjectForm.role} onChange={(e) => setEditSubjectForm({ ...editSubjectForm, role: e.target.value })}
                          title="Role" className="w-full rounded bg-gray-800 border border-gray-700 text-white text-xs px-2 py-1.5">
                          {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                        </select>
                        <div className="flex gap-2">
                          <Button type="button" onClick={() => handleEditSubjectSave(p)} disabled={savingEditSubject}
                            className="h-7 px-3 text-xs bg-[#C4922A] hover:bg-[#A67822] text-white">
                            <Check size={12} className="mr-1" />{savingEditSubject ? "Saving..." : "Save"}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setEditSubjectId(null)}
                            className="h-7 px-3 text-xs border-gray-700 text-gray-300 hover:bg-gray-800">Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-3 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white text-sm font-medium">{p.first_name} {p.last_name}</p>
                            <Badge className={`text-xs border ${roleColor[p.role] ?? roleColor.subject}`}>
                              {p.role ?? "subject"}
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {p.email || "—"}{p.phone ? ` · ${p.phone}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" onClick={() => openAura({ task: "subject_profile", personId: p.id })}
                            title="Aura subject profile"
                            className="p-1 rounded text-gray-600 hover:text-purple-400 hover:bg-purple-400/10 transition-colors">
                            <Sparkles size={13} />
                          </button>
                          <button type="button" onClick={() => startEditSubject(p)} title="Edit subject"
                            className="p-1 rounded text-gray-600 hover:text-[#C4922A] hover:bg-[#C4922A]/10 transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button type="button" onClick={() => handleUnlinkSubject(p)}
                            disabled={deletingSubject === p.id} title="Remove from case"
                            className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evidence */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Shield size={15} /> Evidence
            </CardTitle>
            <button type="button" onClick={() => setShowUpload(!showUpload)}
              className="flex items-center gap-1 text-xs text-[#C4922A] hover:text-[#A67822]">
              <Upload size={12} /> Upload
            </button>
          </CardHeader>
          <CardContent>
            {showUpload && (
              <form onSubmit={handleUpload} className="mb-4 space-y-3 p-3 bg-gray-800/50 rounded-md border border-gray-700">
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    required
                    title="Evidence file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                    className="w-full text-xs text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-700 file:text-white hover:file:bg-gray-600 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Description (optional)"
                  title="Evidence description"
                  className="w-full rounded bg-gray-800 border border-gray-700 text-white text-xs px-2 py-1.5 placeholder:text-gray-500"
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={uploading} className="h-7 px-3 text-xs bg-[#C4922A] hover:bg-[#A67822] text-white">
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowUpload(false)}
                    className="h-7 px-3 text-xs border-gray-700 text-gray-300 hover:bg-gray-800">Cancel</Button>
                </div>
              </form>
            )}
            {evidence.length === 0 && !showUpload ? (
              <div className="text-center py-8">
                <Shield size={24} className="mx-auto text-gray-700 mb-2" />
                <p className="text-gray-500 text-sm">No evidence uploaded for this case</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {evidence.map((e) => (
                  <div key={e.id} className="py-3">
                    <p className="text-white text-sm font-medium">{e.original_filename || "Unnamed file"}</p>
                    <p className="text-gray-600 text-xs mt-0.5 font-mono truncate">SHA256: {e.sha256 || "—"}</p>
                    <p className="text-gray-600 text-xs">{new Date(e.uploaded_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* OSINT Results */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Search size={15} /> OSINT Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {osint.length === 0 ? (
            <div className="text-center py-8">
              <Search size={24} className="mx-auto text-gray-700 mb-2" />
              <p className="text-gray-500 text-sm">No OSINT queries run for this case</p>
              <Button
                onClick={() => router.push("/dashboard/osint")}
                className="mt-3 bg-[#C4922A] hover:bg-[#A67822] text-white text-xs h-8 px-3"
              >
                Run OSINT Query
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {osint.map((r) => (
                <div key={r.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{r.query_value}</p>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">{r.summary}</p>
                    <p className="text-gray-600 text-xs mt-1">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Badge className="text-xs bg-[#C4922A]/20 text-[#C4922A] border border-[#C4922A]/30">{r.query_type}</Badge>
                    <Badge className="text-xs bg-gray-700 text-gray-300 border border-gray-600">{r.provider}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Case Notes */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Pencil size={15} /> Investigator Notes
          </CardTitle>
          {!editingNotes && (
            <button type="button" onClick={() => setEditingNotes(true)}
              className="text-xs text-[#C4922A] hover:text-[#A67822]">
              {caseData.notes ? "Edit" : "+ Add Notes"}
            </button>
          )}
        </CardHeader>
        <CardContent>
          {editingNotes ? (
            <div className="space-y-3">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                rows={6}
                placeholder="Add investigator notes for this case..."
                className="w-full rounded-md bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 placeholder:text-gray-600 resize-none"
              />
              <div className="flex gap-2">
                <Button type="button" onClick={handleNotesSave} disabled={savingNotes}
                  className="h-7 px-3 text-xs bg-[#C4922A] hover:bg-[#A67822] text-white">
                  <Check size={12} className="mr-1" />{savingNotes ? "Saving..." : "Save Notes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setEditingNotes(false); setNotesValue(caseData.notes ?? ""); }}
                  className="h-7 px-3 text-xs border-gray-700 text-gray-300 hover:bg-gray-800">Cancel</Button>
              </div>
            </div>
          ) : caseData.notes ? (
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{caseData.notes}</p>
          ) : (
            <div className="text-center py-8">
              <Pencil size={24} className="mx-auto text-gray-700 mb-2" />
              <p className="text-gray-500 text-sm">No notes yet</p>
              <button type="button" onClick={() => setEditingNotes(true)}
                className="mt-2 text-[#C4922A] text-xs hover:underline">+ Add notes</button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <CaseTimeline caseData={caseData} evidence={evidence} osint={osint} people={people} />
    </div>
  );
}

interface TimelineEvent {
  id: string;
  time: Date;
  label: string;
  detail?: string;
  color: string;
}

function CaseTimeline({ caseData, evidence, osint, people }: {
  caseData: Case;
  evidence: Evidence[];
  osint: OsintResult[];
  people: Person[];
}) {
  const events: TimelineEvent[] = [
    {
      id: "case-created",
      time: new Date(caseData.created_at),
      label: "Case created",
      detail: caseData.title,
      color: "bg-[#C4922A]",
    },
    ...people.map((p) => ({
      id: `person-${p.id}`,
      time: new Date(caseData.created_at), // people don't carry their own timestamp in this context
      label: "Subject linked",
      detail: `${p.first_name} ${p.last_name}`,
      color: "bg-purple-500",
    })),
    ...evidence.map((e) => ({
      id: `evidence-${e.id}`,
      time: new Date(e.uploaded_at),
      label: "Evidence uploaded",
      detail: e.original_filename || "Unnamed file",
      color: "bg-green-500",
    })),
    ...osint.map((r) => ({
      id: `osint-${r.id}`,
      time: new Date(r.created_at),
      label: "OSINT query run",
      detail: r.query_value,
      color: "bg-blue-500",
    })),
  ].sort((a, b) => b.time.getTime() - a.time.getTime());

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-base flex items-center gap-2">
          <Clock size={15} /> Case Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Clock size={24} className="mx-auto text-gray-700 mb-2" />
            <p className="text-gray-500 text-sm">No activity yet</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-800" />
            <div className="space-y-4">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-start gap-4">
                  <div className={`w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 ${ev.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{ev.label}</p>
                    {ev.detail && <p className="text-gray-400 text-xs mt-0.5 truncate">{ev.detail}</p>}
                    <p className="text-gray-600 text-xs mt-0.5">{ev.time.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
