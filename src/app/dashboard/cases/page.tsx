"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCases, createCase, deleteCase } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, FolderOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Case {
  id: number;
  title: string;
  description: string;
  status: string;
  reference_id: string;
  created_at: string;
}

const statusColor: Record<string, string> = {
  open: "bg-green-500/20 text-green-400 border-green-500/30",
  in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const statusLabel: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  closed: "Closed",
};

export default function CasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  function fetchCases() {
    getCases()
      .then((res) => setCases(res.data.results ?? res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchCases(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createCase({ title, description, status: "open" });
      setTitle("");
      setDescription("");
      setShowForm(false);
      fetchCases();
      toast.success("Case created successfully");
    } catch {
      toast.error("Failed to create case");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    if (!confirm("Delete this case? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await deleteCase(id);
      setCases((prev) => prev.filter((c) => c.id !== id));
      toast.success("Case deleted");
    } catch {
      toast.error("Failed to delete case");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Cases</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your investigative cases</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-[#C4922A] hover:bg-[#A67822] text-white">
          <Plus size={16} className="mr-2" /> New Case
        </Button>
      </div>

      {showForm && (
        <Card className="bg-gray-900 border-gray-800">
          <div className="flex items-center justify-between px-6 pt-4 pb-2">
            <p className="text-white font-medium text-base">Create New Case</p>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white" title="Close">
              <X size={16} />
            </button>
          </div>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-gray-300">Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Case title"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" required />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-300">Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-[#C4922A] hover:bg-[#A67822] text-white" disabled={saving}>
                  {saving ? "Creating..." : "Create Case"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800">Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded bg-gray-800 animate-pulse" />)}
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <FolderOpen size={24} className="text-gray-600" />
              </div>
              <p className="text-white font-medium">No cases yet</p>
              <p className="text-gray-500 text-sm mt-1">Create your first case to start an investigation</p>
              <Button onClick={() => setShowForm(true)} className="mt-4 bg-[#C4922A] hover:bg-[#A67822] text-white">
                <Plus size={16} className="mr-2" /> Create First Case
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {cases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => router.push(`/dashboard/cases/${c.id}`)}
                  className="py-4 flex items-start justify-between cursor-pointer hover:bg-gray-800/50 -mx-4 px-4 transition-colors rounded group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{c.title}</p>
                    {c.description && <p className="text-gray-400 text-sm mt-0.5 truncate">{c.description}</p>}
                    <p className="text-gray-600 text-xs mt-1">{c.reference_id} · {new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <Badge className={`text-xs border ${statusColor[c.status] ?? "bg-gray-700 text-gray-300 border-gray-600"}`}>
                      {statusLabel[c.status] ?? c.status}
                    </Badge>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, c.id)}
                      disabled={deleting === c.id}
                      className="p-1 rounded text-gray-700 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      title="Delete case"
                    >
                      <Trash2 size={14} />
                    </button>
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
