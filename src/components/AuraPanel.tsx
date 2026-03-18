"use client";

import { useEffect, useState } from "react";
import { useAura, AuraTask } from "@/context/AuraContext";
import { callAura, getCases, getPeople, getWatchlist } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Copy, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface Case { id: number; title: string; reference_id: string; }
interface Person { id: number; first_name: string; last_name: string; cases: number[]; }
interface WatchlistItem { id: number; label: string; target_value: string; }

const TASKS: { value: AuraTask; label: string; description: string; needs: string[] }[] = [
  { value: "case_summary", label: "Case Summary", description: "Full situational briefing of a case", needs: ["case"] },
  { value: "subject_profile", label: "Subject Profile", description: "Intelligence profile for a person", needs: ["person"] },
  { value: "osint_interpretation", label: "OSINT Interpretation", description: "Analyze OSINT results for a case", needs: ["case"] },
  { value: "threat_assessment", label: "Threat Assessment", description: "Risk assessment for a watchlist target", needs: ["watchlist"] },
  { value: "case_qa", label: "Ask a Question", description: "Ask Aura anything about a case", needs: ["case", "question"] },
];

export default function AuraPanel() {
  const { auraOpen, auraTask, auraCaseId, auraPersonId, auraWatchlistId, closeAura } = useAura();

  const [task, setTask] = useState<AuraTask>(null);
  const [caseId, setCaseId] = useState<string>("");
  const [personId, setPersonId] = useState<string>("");
  const [watchlistId, setWatchlistId] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [cases, setCases] = useState<Case[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    if (!auraOpen) return;
    getCases().then((r) => setCases(r.data.results ?? r.data));
    getPeople().then((r) => setPeople(r.data.results ?? r.data));
    getWatchlist().then((r) => setWatchlist(r.data.results ?? r.data));
  }, [auraOpen]);

  useEffect(() => {
    if (!auraOpen) return;
    setTask(auraTask);
    setCaseId(auraCaseId ? String(auraCaseId) : "");
    setPersonId(auraPersonId ? String(auraPersonId) : "");
    setWatchlistId(auraWatchlistId ? String(auraWatchlistId) : "");
    setResult("");
    setQuestion("");
  }, [auraOpen, auraTask, auraCaseId, auraPersonId, auraWatchlistId]);

  const currentTask = TASKS.find((t) => t.value === task);

  async function handleRun() {
    if (!task) { toast.error("Select a task first"); return; }
    const payload: Record<string, unknown> = { task };
    if (currentTask?.needs.includes("case") && caseId) payload.case_id = Number(caseId);
    if (currentTask?.needs.includes("person") && personId) payload.person_id = Number(personId);
    if (currentTask?.needs.includes("watchlist") && watchlistId) payload.watchlist_id = Number(watchlistId);
    if (currentTask?.needs.includes("question")) payload.question = question;

    setLoading(true);
    setResult("");
    try {
      const res = await callAura(payload);
      setResult(res.data.result);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Aura encountered an error";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!auraOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={closeAura} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg h-full bg-gray-900 border-l border-gray-800 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Sparkles size={14} className="text-purple-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Aura</p>
              <p className="text-gray-500 text-xs">AI Intelligence Analyst</p>
            </div>
          </div>
          <button type="button" onClick={closeAura} className="text-gray-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Task selector */}
          <div className="space-y-2">
            <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">Task</p>
            <div className="grid grid-cols-1 gap-2">
              {TASKS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => { setTask(t.value); setResult(""); }}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                    task === t.value
                      ? "border-purple-500/50 bg-purple-500/10"
                      : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                  }`}
                >
                  <Sparkles size={14} className={task === t.value ? "text-purple-400 mt-0.5 shrink-0" : "text-gray-600 mt-0.5 shrink-0"} />
                  <div>
                    <p className={`text-sm font-medium ${task === t.value ? "text-purple-300" : "text-gray-300"}`}>{t.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{t.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Context selectors */}
          {currentTask && (
            <div className="space-y-3">
              <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">Context</p>

              {currentTask.needs.includes("case") && (
                <div className="space-y-1">
                  <label className="text-gray-400 text-xs">Case</label>
                  <div className="relative">
                    <select
                      value={caseId}
                      onChange={(e) => setCaseId(e.target.value)}
                      title="Select case"
                      className="w-full rounded-md bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 appearance-none"
                    >
                      <option value="">— Select a case —</option>
                      {cases.map((c) => (
                        <option key={c.id} value={c.id}>{c.reference_id} — {c.title}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              )}

              {currentTask.needs.includes("person") && (
                <div className="space-y-1">
                  <label className="text-gray-400 text-xs">Subject</label>
                  <div className="relative">
                    <select
                      value={personId}
                      onChange={(e) => setPersonId(e.target.value)}
                      title="Select subject"
                      className="w-full rounded-md bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 appearance-none"
                    >
                      <option value="">— Select a subject —</option>
                      {people.map((p) => (
                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              )}

              {currentTask.needs.includes("watchlist") && (
                <div className="space-y-1">
                  <label className="text-gray-400 text-xs">Watchlist Target</label>
                  <div className="relative">
                    <select
                      value={watchlistId}
                      onChange={(e) => setWatchlistId(e.target.value)}
                      title="Select watchlist target"
                      className="w-full rounded-md bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 appearance-none"
                    >
                      <option value="">— Select a target —</option>
                      {watchlist.map((w) => (
                        <option key={w.id} value={w.id}>{w.label} — {w.target_value}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              )}

              {currentTask.needs.includes("question") && (
                <div className="space-y-1">
                  <label className="text-gray-400 text-xs">Your Question</label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={3}
                    placeholder="Ask Aura anything about this case..."
                    className="w-full rounded-md bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 placeholder:text-gray-600 resize-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">Aura&apos;s Analysis</p>
                <button type="button" onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors">
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="rounded-lg bg-gray-800/70 border border-gray-700 p-4">
                <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{result}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center animate-pulse">
                <Sparkles size={16} className="text-purple-400" />
              </div>
              <p className="text-gray-400 text-sm">Aura is analyzing...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-800">
          <Button
            onClick={handleRun}
            disabled={loading || !task}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
          >
            <Sparkles size={14} className="mr-2" />
            {loading ? "Analyzing..." : "Run Aura"}
          </Button>
        </div>
      </div>
    </div>
  );
}
