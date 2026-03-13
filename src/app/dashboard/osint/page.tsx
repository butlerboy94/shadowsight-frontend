"use client";

import { useEffect, useState } from "react";
import { getCases, getOsintProviders, runOsintQuery, getOsintResults } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface Case { id: number; title: string; reference_id: string; }
interface ProviderInfo { supported_query_types: string[]; }
interface OsintResult {
  id: number;
  query_type: string;
  query_value: string;
  provider: string;
  summary: string;
  created_at: string;
}

const QUERY_TYPES = ["email", "username", "domain", "phone", "ip"];

function OsintResultCard({ result }: { result: Record<string, unknown> }) {
  const normalized = (result.normalized ?? {}) as Record<string, unknown>;
  const raw = (result.raw ?? {}) as Record<string, unknown>;

  // Build a flat list of key/value pairs to display
  const fields: { label: string; value: string }[] = [];

  const add = (label: string, val: unknown) => {
    if (val === null || val === undefined || val === "") return;
    if (Array.isArray(val)) {
      if (val.length === 0) return;
      fields.push({ label, value: val.join(", ") });
    } else {
      fields.push({ label, value: String(val) });
    }
  };

  // Top-level result fields
  add("Query", result.query_value);
  add("Type", result.query_type);
  add("Provider", result.provider);
  add("Confidence", result.confidence !== undefined ? `${Math.round(Number(result.confidence) * 100)}%` : undefined);
  add("Summary", result.summary);

  // Normalized data (clean, provider-parsed fields)
  for (const [k, v] of Object.entries(normalized)) {
    if (k === "tags") continue;
    add(k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), v);
  }

  // Tags
  const tags = (normalized.tags ?? raw.tags ?? []) as string[];

  return (
    <div className="space-y-3">
      {/* Summary banner */}
      {result.summary && (
        <div className="bg-gray-800 rounded-md px-3 py-2">
          <p className="text-white text-sm">{String(result.summary)}</p>
        </div>
      )}

      {/* Field grid */}
      <div className="grid grid-cols-1 gap-1.5">
        {fields.filter(f => f.label !== "Summary").map(({ label, value }) => (
          <div key={label} className="flex gap-2 text-sm">
            <span className="text-gray-500 shrink-0 w-32">{label}</span>
            <span className="text-gray-200 break-all">{value}</span>
          </div>
        ))}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {tags.map((tag) => (
            <Badge key={tag} className="text-xs bg-gray-700 text-gray-300 border border-gray-600">{tag}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OsintPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [results, setResults] = useState<OsintResult[]>([]);
  const [caseId, setCaseId] = useState("");
  const [queryType, setQueryType] = useState("email");
  const [queryValue, setQueryValue] = useState("");
  const [provider, setProvider] = useState("auto");
  const [providers, setProviders] = useState<Record<string, ProviderInfo>>({});
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    getCases().then((res) => setCases(res.data.results ?? res.data));
    getOsintProviders().then((res) => setProviders(res.data));
    getOsintResults().then((res) => setResults(res.data.results ?? res.data));
  }, []);

  // Get providers that support the selected query type
  const availableProviders = Object.entries(providers)
    .filter(([, info]) => Array.isArray(info.supported_query_types) && info.supported_query_types.includes(queryType))
    .map(([name]) => name);

  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLastResult(null);
    setRunning(true);
    try {
      const payload: Record<string, unknown> = {
        query_type: queryType,
        query_value: queryValue,
      };
      if (caseId) payload.case_id = Number(caseId);
      if (provider !== "auto") payload.provider = provider;

      const res = await runOsintQuery(payload);
      setLastResult(res.data);
      // Refresh results list
      getOsintResults().then((r) => setResults(r.data.results ?? r.data));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error ?? "Query failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">OSINT</h1>
        <p className="text-gray-400 text-sm mt-1">Run open-source intelligence queries</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Query form */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Search size={16} /> New Query
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRun} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-gray-300">Query Type</Label>
                <select
                  title="Query Type"
                  value={queryType}
                  onChange={(e) => { setQueryType(e.target.value); setProvider("auto"); }}
                  className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm"
                >
                  {QUERY_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-gray-300">Value</Label>
                <Input
                  value={queryValue}
                  onChange={(e) => setQueryValue(e.target.value)}
                  placeholder={`Enter ${queryType} to query`}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-gray-300">Provider</Label>
                <select
                  title="Provider"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm"
                >
                  <option value="auto">Auto (best match)</option>
                  {availableProviders.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-gray-300">Link to Case (optional)</Label>
                <select
                  title="Link to Case"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm"
                >
                  <option value="">— None —</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>{c.title} ({c.reference_id})</option>
                  ))}
                </select>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <Button type="submit" className="w-full bg-[#C4922A] hover:bg-[#A67822] text-white" disabled={running}>
                {running ? "Running..." : "Run Query"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Last result */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Last Result</CardTitle>
          </CardHeader>
          <CardContent>
            {lastResult ? (
              <OsintResultCard result={lastResult as Record<string, unknown>} />
            ) : (
              <div className="text-center py-8">
                <Search size={24} className="mx-auto text-gray-700 mb-2" />
                <p className="text-gray-500 text-sm">Run a query to see results here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Query History</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-gray-500 text-sm">No queries yet.</p>
          ) : (
            <div className="divide-y divide-gray-800">
              {results.slice(0, 20).map((r) => (
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
    </div>
  );
}
