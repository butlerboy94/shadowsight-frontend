"use client";

import { useEffect, useRef, useState } from "react";
import { useAura, AuraTask } from "@/context/AuraContext";
import { callAura, getCases, getPeople, getWatchlist } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Copy, Check, ChevronDown, Send, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface Case { id: number; title: string; reference_id: string; }
interface Person { id: number; first_name: string; last_name: string; }
interface WatchlistItem { id: number; label: string; target_value: string; }

interface Message { role: "user" | "assistant"; content: string; }

const TASKS: { value: AuraTask; label: string; description: string; needs: string[] }[] = [
  { value: "case_summary",        label: "Case Summary",        description: "Full situational briefing of a case",     needs: ["case"] },
  { value: "subject_profile",     label: "Subject Profile",     description: "Intelligence profile for a person",       needs: ["person"] },
  { value: "osint_interpretation",label: "OSINT Interpretation",description: "Analyze OSINT results for a case",        needs: ["case"] },
  { value: "threat_assessment",   label: "Threat Assessment",   description: "Risk assessment for a watchlist target",  needs: ["watchlist"] },
  { value: "case_qa",             label: "Ask a Question",      description: "Ask Aura anything about a case",          needs: ["case", "question"] },
];

export default function AuraPanel() {
  const { auraOpen, auraTask, auraCaseId, auraPersonId, auraWatchlistId, closeAura } = useAura();

  const [task, setTask]               = useState<AuraTask>(null);
  const [caseId, setCaseId]           = useState("");
  const [personId, setPersonId]       = useState("");
  const [watchlistId, setWatchlistId] = useState("");
  const [question, setQuestion]       = useState("");
  const [messages, setMessages]       = useState<Message[]>([]);
  const [reply, setReply]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [copied, setCopied]           = useState<number | null>(null);

  const [cases, setCases]         = useState<Case[]>([]);
  const [people, setPeople]       = useState<Person[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);

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
    setMessages([]);
    setReply("");
    setQuestion("");
  }, [auraOpen, auraTask, auraCaseId, auraPersonId, auraWatchlistId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const currentTask = TASKS.find((t) => t.value === task);
  const hasConversation = messages.length > 0;

  async function handleRun() {
    if (!task) { toast.error("Select a task first"); return; }
    const payload: Record<string, unknown> = { task };
    if (currentTask?.needs.includes("case") && caseId) payload.case_id = Number(caseId);
    if (currentTask?.needs.includes("person") && personId) payload.person_id = Number(personId);
    if (currentTask?.needs.includes("watchlist") && watchlistId) payload.watchlist_id = Number(watchlistId);
    if (currentTask?.needs.includes("question")) payload.question = question;

    // Add the user's initial prompt to chat
    const userLabel = currentTask?.needs.includes("question") && question
      ? question
      : `Run: ${currentTask?.label}`;
    setMessages([{ role: "user", content: userLabel }]);

    setLoading(true);
    try {
      const res = await callAura(payload);
      setMessages([
        { role: "user", content: userLabel },
        { role: "assistant", content: res.data.result },
      ]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Aura encountered an error";
      toast.error(msg);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleReply() {
    if (!reply.trim() || !task) return;
    const userMsg = reply.trim();
    setReply("");

    // Build history from current messages for the API
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    const nextMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(nextMessages);

    setLoading(true);
    try {
      const res = await callAura({ task, reply: userMsg, history });
      setMessages([...nextMessages, { role: "assistant", content: res.data.result }]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Aura encountered an error";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(content: string, idx: number) {
    await navigator.clipboard.writeText(content);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleReset() {
    setMessages([]);
    setReply("");
    setQuestion("");
  }

  if (!auraOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={closeAura} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg h-full bg-gray-900 border-l border-gray-800 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Sparkles size={14} className="text-purple-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Aura</p>
              <p className="text-gray-500 text-xs">AI Intelligence Analyst</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasConversation && (
              <button type="button" onClick={handleReset} title="New conversation"
                className="text-gray-500 hover:text-white transition-colors">
                <RotateCcw size={14} />
              </button>
            )}
            <button type="button" onClick={closeAura} title="Close" className="text-gray-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Config (only shown before first run) */}
        {!hasConversation && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Task selector */}
            <div className="space-y-2">
              <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">Task</p>
              <div className="grid grid-cols-1 gap-2">
                {TASKS.map((t) => (
                  <button key={t.value} type="button"
                    onClick={() => { setTask(t.value); setMessages([]); }}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                      task === t.value
                        ? "border-purple-500/50 bg-purple-500/10"
                        : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                    }`}>
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
                      <select value={caseId} onChange={(e) => setCaseId(e.target.value)} title="Select case"
                        className="w-full rounded-md bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 appearance-none">
                        <option value="">— Select a case —</option>
                        {cases.map((c) => <option key={c.id} value={c.id}>{c.reference_id} — {c.title}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                )}

                {currentTask.needs.includes("person") && (
                  <div className="space-y-1">
                    <label className="text-gray-400 text-xs">Subject</label>
                    <div className="relative">
                      <select value={personId} onChange={(e) => setPersonId(e.target.value)} title="Select subject"
                        className="w-full rounded-md bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 appearance-none">
                        <option value="">— Select a subject —</option>
                        {people.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                )}

                {currentTask.needs.includes("watchlist") && (
                  <div className="space-y-1">
                    <label className="text-gray-400 text-xs">Watchlist Target</label>
                    <div className="relative">
                      <select value={watchlistId} onChange={(e) => setWatchlistId(e.target.value)} title="Select watchlist target"
                        className="w-full rounded-md bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 appearance-none">
                        <option value="">— Select a target —</option>
                        {watchlist.map((w) => <option key={w.id} value={w.id}>{w.label} — {w.target_value}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                )}

                {currentTask.needs.includes("question") && (
                  <div className="space-y-1">
                    <label className="text-gray-400 text-xs">Your Question</label>
                    <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3}
                      placeholder="Ask Aura anything about this case..."
                      className="w-full rounded-md bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 placeholder:text-gray-600 resize-none" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Chat messages (shown after first run) */}
        {hasConversation && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-1 mr-2">
                    <Sparkles size={11} className="text-purple-400" />
                  </div>
                )}
                <div className={`relative group max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-[#C4922A]/20 border border-[#C4922A]/30 text-gray-200"
                    : "bg-gray-800 border border-gray-700 text-gray-200"
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  {m.role === "assistant" && (
                    <button type="button" onClick={() => handleCopy(m.content, i)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-gray-500 hover:text-white">
                      {copied === i ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-1 mr-2">
                  <Sparkles size={11} className="text-purple-400 animate-pulse" />
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
                  <div className="flex gap-1.5 items-center h-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-800 shrink-0">
          {!hasConversation ? (
            <Button onClick={handleRun} disabled={loading || !task}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50">
              <Sparkles size={14} className="mr-2" />
              {loading ? "Analyzing..." : "Run Aura"}
            </Button>
          ) : (
            <div className="flex gap-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); }
                }}
                disabled={loading}
                rows={2}
                placeholder="Reply to Aura... (Enter to send, Shift+Enter for new line)"
                className="flex-1 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 placeholder:text-gray-600 resize-none disabled:opacity-50"
              />
              <button type="button" onClick={handleReply} disabled={loading || !reply.trim()} title="Send reply"
                className="px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-40">
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
