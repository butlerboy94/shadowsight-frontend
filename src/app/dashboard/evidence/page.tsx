"use client";

import { useEffect, useState, useRef } from "react";
import { getEvidence, uploadEvidence, getCases } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, Upload, X } from "lucide-react";
import { toast } from "sonner";

interface EvidenceItem {
  id: number;
  description: string;
  sha256: string;
  original_filename: string;
  size_bytes: number | null;
  content_type: string;
  uploaded_at: string;
  case: number;
}
interface Case { id: number; title: string; reference_id: string; }

const typeColor: Record<string, string> = {
  document: "bg-[#C4922A]/20 text-[#C4922A] border-[#C4922A]/30",
  image: "bg-green-500/20 text-green-400 border-green-500/30",
  video: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  audio: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function guessContentType(file: File): string {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (
    file.type === "application/pdf" ||
    file.type.startsWith("text/") ||
    file.type.includes("word") ||
    file.type.includes("spreadsheet") ||
    file.name.endsWith(".pdf") ||
    file.name.endsWith(".doc") ||
    file.name.endsWith(".docx")
  ) return "document";
  return "other";
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [caseId, setCaseId] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function fetchEvidence() {
    getEvidence()
      .then((res) => setEvidence(res.data.results ?? res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchEvidence();
    getCases().then((res) => setCases(res.data.results ?? res.data));
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !caseId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("case", caseId);
      fd.append("file", file);
      fd.append("description", description);
      fd.append("content_type", guessContentType(file));
      await uploadEvidence(fd);
      setFile(null);
      setDescription("");
      setCaseId("");
      setShowForm(false);
      if (fileRef.current) fileRef.current.value = "";
      fetchEvidence();
      toast.success("Evidence uploaded");
    } catch {
      toast.error("Failed to upload evidence");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Evidence</h1>
          <p className="text-gray-400 text-sm mt-1">Evidence items with SHA-256 integrity verification</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-[#C4922A] hover:bg-[#A67822] text-white">
          <Upload size={16} className="mr-2" /> Upload Evidence
        </Button>
      </div>

      {showForm && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white text-base">Upload Evidence</CardTitle>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X size={16} /></button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-gray-300">Case</Label>
                <select
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  required
                  className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm"
                >
                  <option value="" disabled>— Select a case —</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>{c.title} ({c.reference_id})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-gray-300">File</Label>
                <input
                  ref={fileRef}
                  type="file"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-700 file:text-white hover:file:bg-gray-600 cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-300">Description <span className="text-gray-500">(optional)</span></Label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this evidence"
                  className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm placeholder:text-gray-500"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-[#C4922A] hover:bg-[#A67822] text-white" disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload"}
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
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Shield size={16} /> Evidence Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded bg-gray-800 animate-pulse" />)}</div>
          ) : evidence.length === 0 ? (
            <div className="text-center py-12">
              <Shield size={32} className="mx-auto text-gray-700 mb-3" />
              <p className="text-gray-500">No evidence uploaded yet.</p>
              <button type="button" onClick={() => setShowForm(true)} className="mt-3 text-[#C4922A] text-sm hover:underline">
                + Upload first evidence item
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {evidence.map((item) => (
                <div key={item.id} className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{item.original_filename || "Unnamed file"}</p>
                      {item.description && <p className="text-gray-400 text-sm mt-0.5">{item.description}</p>}
                      <p className="text-gray-600 text-xs mt-1 font-mono truncate">SHA256: {item.sha256 || "—"}</p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {new Date(item.uploaded_at).toLocaleString()}
                        {item.size_bytes ? ` · ${formatBytes(item.size_bytes)}` : ""}
                      </p>
                    </div>
                    <Badge className={`text-xs border ml-4 shrink-0 ${typeColor[item.content_type] ?? typeColor.other}`}>
                      {item.content_type || "other"}
                    </Badge>
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
